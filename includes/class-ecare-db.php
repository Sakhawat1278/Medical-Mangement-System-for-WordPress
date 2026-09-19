<?php

if (!defined('ABSPATH')) {
    exit;
}

class ECARE_DB {

    const DB_VERSION = '3.1';

    /**
     * Create or upgrade the ecare_documents MySQL table.
     * Called on plugin activation and from admin_init.
     */
    public static function create_tables() {
        ECARE_DB_Client::create_table();
        self::migrate_document_ids();
        update_option('ecare_db_version', self::DB_VERSION);
    }

    /**
     * Run upgrade if DB version is outdated.
     */
    public static function maybe_upgrade() {
        $installed = get_option('ecare_db_version', '0');
        if (version_compare($installed, self::DB_VERSION, '<')) {
            self::create_tables();
        }
    }

    /**
     * Migrate UUID-based keys in ecare_patients and ecare_staff documents
     * to WordPress integer user IDs to prevent long UUID displays.
     */
    public static function migrate_document_ids() {
        global $wpdb;
        $table = $wpdb->prefix . 'ecare_documents';

        // Check if table exists first
        if (!self::is_healthy()) {
            return;
        }

        // 1. Fetch all documents in ecare_patients and ecare_staff
        $rows = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$table} WHERE collection IN (%s, %s)",
                'ecare_patients',
                'ecare_staff'
            )
        );

        if (empty($rows)) {
            return;
        }

        $id_map = array(); // old UUID -> new integer ID

        foreach ($rows as $row) {
            $old_id = $row->id;
            // Only migrate if old ID is a UUID (length is 36)
            if (strlen($old_id) !== 36 || strpos($old_id, '-') === false) {
                continue;
            }

            $obj = json_decode($row->data, true);
            if (empty($obj) || empty($obj['user_id'])) {
                continue;
            }

            $new_id = (string) $obj['user_id'];
            $id_map[$old_id] = $new_id;

            // Update internal JSON id to match the new ID
            $obj['id'] = $new_id;
            $new_json = json_encode($obj, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

            // Delete the old row (since ID is primary key)
            $wpdb->delete($table, array('collection' => $row->collection, 'id' => $old_id), array('%s', '%s'));

            // Check if new row already exists to avoid duplicate primary key errors
            $exists = $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM {$table} WHERE collection = %s AND id = %s", $row->collection, $new_id));
            if (!$exists) {
                // Insert the new row
                $wpdb->insert(
                    $table,
                    array(
                        'id'         => $new_id,
                        'collection' => $row->collection,
                        'data'       => $new_json,
                        'created_at' => $row->created_at,
                        'updated_at' => $row->updated_at
                    ),
                    array('%s', '%s', '%s', '%s', '%s')
                );
            }
        }

        // 2. Scan all documents in all collections, and if any JSON field contains an old UUID from $id_map, replace it with the new integer ID
        if (!empty($id_map)) {
            $all_rows = $wpdb->get_results("SELECT * FROM {$table}");
            foreach ($all_rows as $row) {
                $data_changed = false;
                $data_str = $row->data;

                // Simple check first to see if any old ID exists in the JSON string
                foreach ($id_map as $old_uuid => $new_int_id) {
                    if (strpos($data_str, $old_uuid) !== false) {
                        $data_str = str_replace($old_uuid, $new_int_id, $data_str);
                        $data_changed = true;
                    }
                }

                if ($data_changed) {
                    $wpdb->update(
                        $table,
                        array('data' => $data_str),
                        array('id' => $row->id, 'collection' => $row->collection),
                        array('%s'),
                        array('%s', '%s')
                    );
                }
            }
        }
    }

    /**
     * No-op: column management is handled by the single JSON document table.
     */
    public static function ensure_columns_exist() {
        return;
    }

    /**
     * Check if the documents table exists and is writable.
     *
     * @return bool
     */
    public static function is_healthy() {
        global $wpdb;
        $table = $wpdb->prefix . 'ecare_documents';
        $exists = $wpdb->get_var("SHOW TABLES LIKE '{$table}'");
        return $exists === $table;
    }
}
