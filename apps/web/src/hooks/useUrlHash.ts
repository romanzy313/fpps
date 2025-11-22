import { useEffect, useState } from "preact/hooks";

// TODO: use context api for global

export function useUrlHash() {
  const [hashValue, setHashValue] = useState(window.location.hash.substring(1));

  const setHash = (newHash: string) => {
    window.location.hash = "#" + newHash; // TODO: check me
    setHashValue(newHash);
  };

  useEffect(() => {
    const onHashChange = () => {
      setHash(window.location.hash.substring(1));
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return {
    hashValue,
    setHash,
  };
}
