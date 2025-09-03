/**
 * 临时的file-saver mock，用于修复启动问题
 */

export const saveAs = (blob: Blob, filename: string) => {
  console.log('Mock saveAs called:', filename)
  // 简单的下载实现
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
