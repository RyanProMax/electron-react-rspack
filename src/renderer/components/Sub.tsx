import { useEffect, useState } from "react";

export default () => {
  const [r, setR] = useState(Math.random());
  useEffect(() => {
    setInterval(() => {
      setR(Math.random());
    }, 1000)
  }, [])

  return (
    <div>
      <h1>{r}</h1>
      Sub Page
    </div>
  );
};
