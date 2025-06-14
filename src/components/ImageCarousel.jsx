// src/components/ImageCarousel.jsx
import React from 'react';
import { motion, LayoutGroup } from 'framer-motion';

export default function ImageCarousel({ images, selectedIndex, setSelectedIndex }) {
  const prevIndex = () => (selectedIndex - 1 + images.length) % images.length;
  const nextIndex = () => (selectedIndex + 1) % images.length;

  const handlePrev = () => setSelectedIndex(prevIndex());
  const handleNext = () => setSelectedIndex(nextIndex());

  // Only render prev, current and next
  const visible = [prevIndex(), selectedIndex, nextIndex()];

  return (
    <div className="flex items-center space-x-4">
      {/* Left arrow */}
      <button
        onClick={handlePrev}
        className="relative z-20 text-3xl font-bold p-2 hover:bg-gray-200 rounded-lg transition"
        aria-label="Previous"
      >
        ‹
      </button>

      <LayoutGroup>
        <motion.div
          layout
          className="flex items-center overflow-hidden relative z-0"
          style={{ width: 330, height: 120 }}
        >
          {visible.map((imgIdx, pos) => {
            const isCenter = pos === 1;

            // Initial animation for incoming cards
            const initialProps = isCenter
              ? { scale: 0.9, opacity: 0 }
              : pos === 0
              ? { x: -50, opacity: 0 }
              : { x: 50, opacity: 0 };

            return (
              <motion.img
                key={imgIdx}
                layout
                src={images[imgIdx]}
                alt={`Slide ${imgIdx}`}
                onClick={pos === 0 ? handlePrev : pos === 2 ? handleNext : undefined}
                initial={initialProps}
                animate={{
                  x: 0,
                  opacity: isCenter ? 1 : 0.5,
                  scale: isCenter ? 1.1 : 1,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={`object-cover rounded-lg cursor-pointer ${
                  isCenter ? 'border-4 border-blue-500 z-10' : ''
                }`}
                style={{
                  width: isCenter ? 120 : 90,
                  height: isCenter ? 96 : 72,
                  marginLeft: pos === 0 ? 0 : 12,
                  marginRight: pos === 2 ? 0 : 12,
                }}
              />
            );
          })}
        </motion.div>
      </LayoutGroup>

      {/* Right arrow */}
      <button
        onClick={handleNext}
        className="relative z-20 text-3xl font-bold p-2 hover:bg-gray-200 rounded-lg transition"
        aria-label="Next"
      >
        ›
      </button>
    </div>
  );
}
