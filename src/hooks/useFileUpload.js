/**
 * useFileUpload
 *
 * A reusable hook that converts a selected file to a base64 data URL,
 * matching the pattern already used in AddDoctor.jsx and AddPatient.jsx.
 *
 * Usage:
 *   const { readAsBase64, readManyAsBase64 } = useFileUpload()
 *
 *   readAsBase64(file) => Promise<string>   — for a single image/file
 *   readManyAsBase64(fileList) => Promise<Array<{ name, data, type }>>  — for multiple docs
 */

const useFileUpload = () => {
  /**
   * Convert a single File to a base64 data URL string.
   * @param {File} file
   * @returns {Promise<string>}
   */
  const readAsBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  /**
   * Convert a FileList / Array of Files into an array of
   * { name, data, type } objects (same shape AddDoctor uses).
   * @param {File[]} files
   * @returns {Promise<Array<{ name: string, data: string, type: string }>>}
   */
  const readManyAsBase64 = async (files) => {
    const results = []
    for (const file of Array.from(files)) {
      const data = await readAsBase64(file)
      results.push({ name: file.name, data, type: file.type })
    }
    return results
  }

  return { readAsBase64, readManyAsBase64 }
}

export default useFileUpload
