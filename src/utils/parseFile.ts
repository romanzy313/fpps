export function parseFile(file: File) {
  return {
    path: file.webkitRelativePath.replace("/" + file.name, ""), // TODO: check windows
    name: file.name,
    sizeBytes: file.size,
  };
}
