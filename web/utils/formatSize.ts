// https://developer.mozilla.org/en-US/docs/Web/API/File_API/Using_files_from_web_applications#example_showing_files_size
// TODO: sometimes this should undefined
export function formatSize(numberOfBytes: number): string {
  if (numberOfBytes === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const exponent = Math.min(
    Math.max(Math.floor(Math.log(numberOfBytes) / Math.log(1000)), 0),
    units.length - 1,
  );
  const approx = numberOfBytes / 1000 ** exponent;
  const output =
    exponent === 0
      ? `${numberOfBytes.toFixed(1)} B`
      : `${approx.toFixed(1)} ${units[exponent]}`;

  return output;
}
