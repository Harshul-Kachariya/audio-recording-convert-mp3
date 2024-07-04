import React from "react";
import AudioPlayer from "./components/AudioPlayer";

const App: React.FC = () => {
  return (
    <div className="App flex flex-col gap-10 text-7xl font-bold text-zinc-200  justify-center items-center w-screen h-screen">
      <h1>Audio Player</h1>
      <AudioPlayer />
    </div>
  );
};

export default App;
