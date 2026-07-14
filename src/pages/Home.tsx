import React from "react";
import { motion } from "framer-motion";

// Fallback local stub for FaultyTerminal when the original module or types
// are not available. Keeps the page working without additional files.
const FaultyTerminal: React.FC<any> = (props) => {
  // Render a lightweight placeholder that preserves layout.
  return (
    <div aria-hidden className="w-full h-full" />
  );
};

// Mock data list for your LeetCode-style problem dashboard
const ALGORITHMS = [
  { id: 1, title: "Binary Search", difficulty: "Easy", language: "Python" },
  { id: 2, title: "Merge Sort", difficulty: "Medium", language: "Java" },
  { id: 3, title: "Dijkstra's Algorithm", difficulty: "Hard", language: "C++" },
];

export default function Home({ onSelectSnippet }: { onSelectSnippet: (title: string, lang: string) => void }) {
  return (
    <div className="relative min-h-screen bg-[#050812] text-white overflow-hidden flex flex-col items-center">
      {/* Background Layer: The React Bits Faulty Terminal */}
      <div className="absolute inset-0 z-0 opacity-80 w-full h-full pointer-events-none">
        <FaultyTerminal
          scale={1}
          digitSize={2}
          scanlineIntensity={0.35}
          glitchAmount={0.2}
          flickerAmount={0.3}
          noiseAmp={0.01}
          chromaticAberration={0.01}
          dither={0.01}
          curvature={0.2}
          tint="#0284c7"
          mouseReact={true}
          mouseStrength={0.3}
          brightness={0.6}
        />
      </div>

      {/* Foreground Layer */}
      <div className="relative z-10 w-full max-w-5xl px-6 pt-32 pb-16 flex flex-col items-center">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent text-5xl font-bold tracking-tight">
            Master Your Muscle Memory
          </h1>
          <p className="text-[#8a9eb0] mt-4 text-lg">
            Select an algorithm to begin your typing test.
          </p>
        </motion.div>

        {/* Animated Glass Table */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.3, duration: 0.5 }}
          className="w-full bg-[#0a101c]/80 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
        >
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/5 border-b border-white/10 text-[#8a9eb0] text-sm uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Algorithm</th>
                <th className="px-6 py-4 font-medium">Language</th>
                <th className="px-6 py-4 font-medium">Difficulty</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {ALGORITHMS.map((algo, index) => (
                <motion.tr 
                  key={algo.id}
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: index * 0.1 + 0.5 }}
                  className="hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5 last:border-0"
                  onClick={() => onSelectSnippet(algo.title, algo.language)}
                >
                  <td className="px-6 py-4 font-medium text-[#e0e8f0]">{algo.title}</td>
                  <td className="px-6 py-4 text-[#8a9eb0]">{algo.language}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      algo.difficulty === 'Easy' ? 'bg-green-500/10 text-green-400' :
                      algo.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {algo.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-[#7dd3fc] text-xl font-mono">→</span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </div>
  );
}