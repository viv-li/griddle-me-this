import { useState } from "react";
import { Button } from "@/components/ui/button";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <h1 className="text-3xl font-bold text-blue-500">Griddle Me This</h1>
      <Button onClick={() => setCount((count) => count + 1)}>Click me</Button>
      <p>Count: {count}</p>
    </>
  );
}

export default App;
