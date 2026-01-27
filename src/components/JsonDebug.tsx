export function JsonDebug(props: { data: unknown }) {
  return (
    <pre>
      <code>{JSON.stringify(props.data, null, 2)}</code>
    </pre>
  );
}
