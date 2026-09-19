<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * ECARE_DB_Client — MySQL ($wpdb) database client
 *
 * Storage: a single `{prefix}ecare_documents` table holding JSON documents,
 * mirroring a single-table design for flexible clinic management records.
 */
class ECARE_DB_Client {

    /** Table name (without prefix) */
    const TABLE = 'ecare_documents';

    // ── Schema bootstrap ───────────────────────────────────────────────────

    /**
     * Create (or upgrade) the documents table.
     * Called on plugin activation and from ECARE_DB::create_tables().
     */
    public static function create_table() {
        global $wpdb;
        $table      = $wpdb->prefix . self::TABLE;
        $charset_collate = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE IF NOT EXISTS {$table} (
            id          VARCHAR(191) NOT NULL,
            collection  VARCHAR(191) NOT NULL,
            data        LONGTEXT     NOT NULL,
            created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (collection, id),
            KEY idx_collection (collection)
        ) {$charset_collate};";

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        dbDelta($sql);
    }

    // ── Private helpers ────────────────────────────────────────────────────

    private static function table() {
        global $wpdb;
        return $wpdb->prefix . self::TABLE;
    }

    private static function get_random_bytes($length) {
        if (function_exists('random_bytes')) {
            try {
                return random_bytes($length);
            } catch (Exception $e) {}
        }
        if (function_exists('openssl_random_pseudo_bytes')) {
            return openssl_random_pseudo_bytes($length);
        }
        return substr(hash('sha256', uniqid((string) mt_rand(), true), true), 0, $length);
    }

    private static function generate_id() {
        // Short 8-char alphanumeric ID: base36 timestamp + random suffix
        $ts   = base_convert((string) time(), 10, 36); // ~6 chars
        $rand = substr(str_replace(['+', '/', '='], '', base64_encode(self::get_random_bytes(6))), 0, 4);
        return strtolower(substr($ts . $rand, 0, 8));
    }

    private static function get_encryption_key() {
        if (defined('ECARE_DB_ENCRYPTION_KEY') && ECARE_DB_ENCRYPTION_KEY !== '') {
            $key = ECARE_DB_ENCRYPTION_KEY;
            if (strlen($key) === 64 && ctype_xdigit($key)) {
                return hex2bin($key);
            }
            return substr(hash('sha256', $key, true), 0, 32);
        }
        $key = get_option('ecare_db_encryption_key');
        if (!$key) {
            $key = bin2hex(self::get_random_bytes(32));
            update_option('ecare_db_encryption_key', $key);
        }
        return hex2bin($key);
    }

    private static function encrypt_value($value) {
        $key = self::get_encryption_key();
        $iv_length = openssl_cipher_iv_length('aes-256-cbc');
        $iv = self::get_random_bytes($iv_length);
        $encrypted = openssl_encrypt((string) $value, 'aes-256-cbc', $key, 0, $iv);
        return base64_encode($iv . $encrypted);
    }

    private static function decrypt_value($payload) {
        $payload = base64_decode($payload, true);
        if ($payload === false) {
            return '';
        }
        $key = self::get_encryption_key();
        $iv_length = openssl_cipher_iv_length('aes-256-cbc');
        $iv = substr($payload, 0, $iv_length);
        $encrypted = substr($payload, $iv_length);
        return openssl_decrypt($encrypted, 'aes-256-cbc', $key, 0, $iv) ?: '';
    }

    private static function get_encrypted_keys($collection) {
        $map = array(
            'ecare_medical_vault'       => array('title', 'description', 'notes', 'attachments', 'fileUrl', 'file_data', 'file_name'),
            'ecare_patient_vitals'      => array('vitals'),
            'ecare_consultation_notes'  => array('notes', 'prescription', 'diagnosis', 'referredTo')
        );
        return $map[$collection] ?? array();
    }

    private static function maybe_encrypt_field($value) {
        if (is_array($value) || is_object($value)) {
            $value = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }
        return 'ecare_enc_v1:' . self::encrypt_value($value);
    }

    private static function maybe_decrypt_field($value) {
        if (is_string($value) && strpos($value, 'ecare_enc_v1:') === 0) {
            $encrypted_part = substr($value, 13);
            $decrypted = self::decrypt_value($encrypted_part);
            $decoded = json_decode($decrypted, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                return $decoded;
            }
            return $decrypted;
        }
        return $value;
    }

    /**
     * Decode a raw DB row into a plain object.
     */
    private static function decode($row, $collection = '') {
        if (!$row) return null;
        $data = is_object($row) ? $row->data : $row['data'];
        $obj  = json_decode($data);
        if (json_last_error() !== JSON_ERROR_NONE) {
            return null;
        }
        if ($obj && !empty($collection)) {
            $encrypted_keys = self::get_encrypted_keys($collection);
            if (!empty($encrypted_keys)) {
                foreach ($encrypted_keys as $key) {
                    if (isset($obj->$key)) {
                        $obj->$key = self::maybe_decrypt_field($obj->$key);
                    }
                }
            }
        }
        return $obj;
    }

    // ── Public API — identical signatures ──────────────────────────────────

    /**
     * Return all documents in a collection, newest first.
     *
     * @param  string $collection
     * @return object[]
     */
    public static function select_all($collection) {
        global $wpdb;
        $table = self::table();

        $rows = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT data FROM {$table} WHERE collection = %s ORDER BY created_at DESC",
                $collection
            )
        );

        if (!$rows) return array();

        $results = array();
        foreach ($rows as $row) {
            $obj = self::decode($row, $collection);
            if ($obj !== null) $results[] = $obj;
        }
        return $results;
    }

    /**
     * Return all documents for multiple collections in a single SQL query.
     *
     * @param  string[] $collections Array of collection names
     * @return array<string, object[]> Map of collection => array of objects
     */
    public static function select_batch_collections($collections) {
        if (empty($collections) || !is_array($collections)) {
            return array();
        }
        global $wpdb;
        $table = self::table();

        $placeholders = implode(',', array_fill(0, count($collections), '%s'));
        $sql = "SELECT collection, data FROM {$table} WHERE collection IN ({$placeholders}) ORDER BY created_at DESC";
        $prepared = $wpdb->prepare($sql, $collections);
        $rows = $wpdb->get_results($prepared);

        $result = array();
        foreach ($collections as $c) {
            $result[$c] = array();
        }

        if (!$rows) {
            return $result;
        }

        foreach ($rows as $row) {
            $col = $row->collection;
            $obj = self::decode($row, $col);
            if ($obj !== null) {
                if (!isset($result[$col])) {
                    $result[$col] = array();
                }
                $result[$col][] = $obj;
            }
        }

        return $result;
    }

    /**
     * Return a single document by its ID.
     *
     * @param  string      $collection
     * @param  string|int  $id
     * @return object|null
     */
    public static function select_one($collection, $id) {
        if ($id === null || $id === '') return null;
        global $wpdb;
        $table = self::table();

        $row = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT data FROM {$table} WHERE collection = %s AND id = %s",
                $collection,
                (string) $id
            )
        );

        return self::decode($row, $collection);
    }

    /**
     * Return all documents where $field == $value (optimized MySQL-side JSON query with PHP fallback).
     *
     * @param  string     $collection
     * @param  string     $field
     * @param  mixed      $value
     * @return object[]
     */
    public static function select_where($collection, $field, $value = null) {
        global $wpdb;
        $table = self::table();

        // Support passing an associative array of ['field' => 'value']
        if (is_array($field)) {
            $first_key = array_key_first($field);
            $value = $first_key !== null ? $field[$first_key] : null;
            $field = (string) $first_key;
        }

        // Standardize value comparison as string
        $val_str = (string) $value;

        // Try utilizing MySQL-native JSON functions (MySQL 5.7+ / MariaDB 10.2+)
        $json_path = '$.' . $field;
        $query = $wpdb->prepare(
            "SELECT data FROM {$table} WHERE collection = %s AND JSON_UNQUOTE(JSON_EXTRACT(data, %s)) = %s ORDER BY created_at DESC",
            $collection,
            $json_path,
            $val_str
        );

        $wpdb->suppress_errors(true);
        $rows = $wpdb->get_results($query);
        $wpdb->suppress_errors(false);

        // If JSON operations aren't supported, fall back to PHP-side filter
        if ($wpdb->last_error !== '') {
            $rows = $wpdb->get_results(
                $wpdb->prepare(
                    "SELECT data FROM {$table} WHERE collection = %s ORDER BY created_at DESC",
                    $collection
                )
            );
            if (!$rows) return array();

            $results = array();
            foreach ($rows as $row) {
                $obj = self::decode($row, $collection);
                if ($obj !== null && property_exists($obj, $field) && (string)$obj->$field == $val_str) {
                    $results[] = $obj;
                }
            }
            return $results;
        }

        if (!$rows) return array();

        $results = array();
        foreach ($rows as $row) {
            $obj = self::decode($row, $collection);
            if ($obj !== null) {
                $results[] = $obj;
            }
        }
        return $results;
    }

    /**
     * Insert a new document. Returns the generated/given ID, or false on failure.
     *
     * @param  string       $collection
     * @param  array|object $data
     * @param  string|null  $id   Provide to use a specific ID
     * @return string|false
     */
    public static function insert($collection, $data, $id = null) {
        global $wpdb;
        $table = self::table();

        if (is_object($data)) {
            $data = (array) $data;
        }

        if (empty($id)) {
            $id = isset($data['id']) && $data['id'] !== '' ? $data['id'] : self::generate_id();
        }

        $data['id']         = $id;
        $data['created_at'] = gmdate('Y-m-d H:i:s');

        $encrypted_keys = self::get_encrypted_keys($collection);
        if (!empty($encrypted_keys)) {
            foreach ($encrypted_keys as $key) {
                if (isset($data[$key]) && $data[$key] !== '') {
                    $data[$key] = self::maybe_encrypt_field($data[$key]);
                }
            }
        }

        $json               = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        $inserted = $wpdb->insert(
            $table,
            array(
                'id'         => (string) $id,
                'collection' => $collection,
                'data'       => $json,
                'created_at' => $data['created_at'],
                'updated_at' => $data['created_at'],
            ),
            array('%s', '%s', '%s', '%s', '%s')
        );

        if ($inserted === false) {
            error_log('[E-CARE] MySQL Insert Error: ' . $wpdb->last_error . ' | collection=' . $collection);
            return false;
        }

        return $id;
    }

    /**
     * Update an existing document by merging $data into it.
     * Returns true on success, false if the document doesn't exist or query fails.
     *
     * @param  string       $collection
     * @param  string|int   $id
     * @param  array|object $data
     * @return bool
     */
    public static function update($collection, $id, $data) {
        global $wpdb;
        $table = self::table();

        $existing = self::select_one($collection, $id);
        if (!$existing) return false;

        $merged              = array_merge((array) $existing, (array) $data);
        $merged['updated_at'] = gmdate('Y-m-d H:i:s');

        $encrypted_keys = self::get_encrypted_keys($collection);
        if (!empty($encrypted_keys)) {
            foreach ($encrypted_keys as $key) {
                if (isset($merged[$key]) && $merged[$key] !== '') {
                    $merged[$key] = self::maybe_encrypt_field($merged[$key]);
                }
            }
        }

        $json                = json_encode($merged, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        $result = $wpdb->update(
            $table,
            array('data' => $json, 'updated_at' => $merged['updated_at']),
            array('collection' => $collection, 'id' => (string) $id),
            array('%s', '%s'),
            array('%s', '%s')
        );

        return $result !== false;
    }

    /**
     * Delete a document by ID. Returns true on success.
     *
     * @param  string     $collection
     * @param  string|int $id
     * @return bool
     */
    public static function delete($collection, $id) {
        global $wpdb;
        $table = self::table();

        $result = $wpdb->delete(
            $table,
            array('collection' => $collection, 'id' => (string) $id),
            array('%s', '%s')
        );

        return $result !== false;
    }

    /**
     * Delete multiple documents by their IDs in a single query.
     *
     * @param  string $collection
     * @param  array  $ids
     * @return int Number of deleted rows
     */
    public static function delete_many($collection, array $ids) {
        if (empty($ids)) return 0;
        global $wpdb;
        $table = self::table();

        $placeholders = implode(',', array_fill(0, count($ids), '%s'));
        $query = $wpdb->prepare(
            "DELETE FROM {$table} WHERE collection = %s AND id IN ({$placeholders})",
            array_merge(array($collection), $ids)
        );

        $result = $wpdb->query($query);
        return $result === false ? 0 : $result;
    }

    /**
     * Delete all documents in a collection in a single query.
     *
     * @param  string $collection
     * @return bool
     */
    public static function delete_collection($collection) {
        global $wpdb;
        $table = self::table();

        $result = $wpdb->delete(
            $table,
            array('collection' => $collection),
            array('%s')
        );

        return $result !== false;
    }
}
