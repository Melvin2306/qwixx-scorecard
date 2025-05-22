"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { motion, useAnimation, Variants } from "framer-motion";
import { useEffect, useState } from "react";

const QwixxScorecard = () => {
  // State for each color row
  const [red, setRed] = useState<number[]>([]);
  const [yellow, setYellow] = useState<number[]>([]);
  const [green, setGreen] = useState<number[]>([]);
  const [blue, setBlue] = useState<number[]>([]);

  // State for penalties
  const [penalties, setPenalties] = useState<number>(0);

  // Animation states
  const [isScoreVisible, setIsScoreVisible] = useState<boolean>(false);

  // State for animation when row is locked
  const [showBonusAnimation, setShowBonusAnimation] = useState<{
    active: boolean;
    color: string;
    x: number;
    y: number;
  }>({ active: false, color: "", x: 0, y: 0 });

  // Max penalties before game ends
  const MAX_PENALTIES = 4;

  // Animation controls
  const controls = useAnimation();

  // Animation variants
  const checkboxVariants: Variants = {
    checked: {
      scale: [1, 1.2, 1],
      transition: { duration: 0.3 },
    },
    unchecked: {
      scale: 1,
    },
  };

  const tableRowVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut",
      },
    }),
  };

  const scoreVariants: Variants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
      opacity: 1,
      height: "auto",
      transition: {
        duration: 0.5,
        ease: "easeInOut",
      },
    },
  };

  const starVariants: Variants = {
    initial: { scale: 0, rotate: -180 },
    animate: {
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
      },
    },
  };

  const buttonVariants: Variants = {
    hover: {
      scale: 1.05,
      transition: { duration: 0.2 },
    },
    tap: {
      scale: 0.95,
      transition: { duration: 0.2 },
    },
  };

  // Variants for bonus animation
  const bonusAnimationVariants: Variants = {
    hidden: { opacity: 0, scale: 0, y: 0 },
    visible: { 
      opacity: [0, 1, 1, 0], 
      scale: [0.5, 1.2, 1.5, 1.8],
      y: -60,
      transition: { 
        duration: 1.5,
        times: [0, 0.2, 0.8, 1],
        ease: "easeOut"
      }
    },
  };

  // Show score animation when rows are updated
  useEffect(() => {
    if (
      red.length > 0 ||
      yellow.length > 0 ||
      green.length > 0 ||
      blue.length > 0
    ) {
      setIsScoreVisible(true);
    }
  }, [red, yellow, green, blue]);

  // Calculate points based on the number of crosses
  const calculatePoints = (count: number): number => {
    const points = [0, 1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 66, 78];
    return points[count] || 0;
  };

  // Calculate total score
  const calculateTotalScore = (): number => {
    // Base score from checked numbers
    const baseScore =
      calculatePoints(red.length) +
      calculatePoints(yellow.length) +
      calculatePoints(green.length) +
      calculatePoints(blue.length);

    // Bonus points for locked rows (1 point per locked row)
    const bonusPoints =
      (isRowLocked("red") ? 1 : 0) +
      (isRowLocked("yellow") ? 1 : 0) +
      (isRowLocked("green") ? 1 : 0) +
      (isRowLocked("blue") ? 1 : 0);

    // Penalty points
    const penaltyPoints = penalties * 5;

    return baseScore + bonusPoints - penaltyPoints;
  };

  // Check if a row is locked
  const isRowLocked = (color: "red" | "yellow" | "green" | "blue"): boolean => {
    const numbers = {
      red: red,
      yellow: yellow,
      green: green,
      blue: blue,
    }[color];

    // Row is locked if it has the last number checked (12 for red/yellow, 2 for green/blue)
    // and has at least 5 numbers checked
    if (color === "red" && red.includes(12) && red.length >= 5) return true;
    if (color === "yellow" && yellow.includes(12) && yellow.length >= 5)
      return true;
    if (color === "green" && green.includes(2) && green.length >= 5)
      return true;
    if (color === "blue" && blue.includes(2) && blue.length >= 5) return true;

    return false;
  };

  // Handle checking/unchecking a number in the ascending rows (red & yellow)
  const handleAscendingNumberToggle = (
    color: "red" | "yellow",
    num: number,
    checked: boolean,
    event?: React.MouseEvent<Element, MouseEvent>
  ) => {
    const setter = color === "red" ? setRed : setYellow;
    const currentNumbers = color === "red" ? [...red] : [...yellow];

    if (checked) {
      // Add number if it's valid
      if (currentNumbers.every((n) => n < num)) {
        // For number 12, check if we can lock the row (at least 5 numbers already checked)
        if (num === 12 && currentNumbers.length < 5) {
          // Can't select 12 without having 5 numbers already
          return;
        }
        
        // Check if this action will lock the row (selecting the 12)
        const willLock = num === 12 && currentNumbers.length >= 5;
        
        setter([...currentNumbers, num].sort((a, b) => a - b));
        
        // If locking the row, show bonus animation
        if (willLock && event) {
          const rect = (event.target as HTMLElement).getBoundingClientRect();
          setShowBonusAnimation({
            active: true,
            color: color === "red" ? "#ff3b30" : "#ffcc00",
            x: rect.left + rect.width / 2,
            y: rect.top
          });
          
          // Reset animation after it completes
          setTimeout(() => {
            setShowBonusAnimation(prev => ({...prev, active: false}));
          }, 1500);
        }
      }
    } else {
      // Can only uncheck if it's the highest number
      if (Math.max(...currentNumbers) === num) {
        setter(currentNumbers.filter((n) => n !== num));
      }
    }
  };

  // Handle checking/unchecking a number in the descending rows (green & blue)
  const handleDescendingNumberToggle = (
    color: "green" | "blue",
    num: number,
    checked: boolean,
    event?: React.MouseEvent<Element, MouseEvent>
  ) => {
    const setter = color === "green" ? setGreen : setBlue;
    const currentNumbers = color === "green" ? [...green] : [...blue];

    if (checked) {
      // Add number if it's valid
      if (currentNumbers.every((n) => n > num)) {
        // For number 2, check if we can lock the row (at least 5 numbers already checked)
        if (num === 2 && currentNumbers.length < 5) {
          // Can't select 2 without having 5 numbers already
          return;
        }
        
        // Check if this action will lock the row (selecting the 2)
        const willLock = num === 2 && currentNumbers.length >= 5;
        
        setter([...currentNumbers, num].sort((a, b) => b - a));
        
        // If locking the row, show bonus animation
        if (willLock && event) {
          const rect = (event.target as HTMLElement).getBoundingClientRect();
          setShowBonusAnimation({
            active: true,
            color: color === "green" ? "#34c759" : "#007aff",
            x: rect.left + rect.width / 2,
            y: rect.top
          });
          
          // Reset animation after it completes
          setTimeout(() => {
            setShowBonusAnimation(prev => ({...prev, active: false}));
          }, 1500);
        }
      }
    } else {
      // Can only uncheck if it's the lowest number
      if (Math.min(...currentNumbers) === num) {
        setter(currentNumbers.filter((n) => n !== num));
      }
    }
  };

  // Handle adding a penalty
  const handleAddPenalty = () => {
    if (penalties < MAX_PENALTIES) {
      setPenalties((prev) => prev + 1);
      // Apply animation for penalty
      controls.start({
        scale: [1, 1.2, 1],
        transition: { duration: 0.3 },
      });
    }
  };

  // Handle reset
  const handleReset = () => {
    setRed([]);
    setYellow([]);
    setGreen([]);
    setBlue([]);
    setPenalties(0);
  };

  // Check if number can be selected
  const canSelectNumber = (
    color: "red" | "yellow" | "green" | "blue",
    num: number
  ): boolean => {
    // If row is locked, no more selections allowed
    if (isRowLocked(color)) return false;

    if (color === "red" || color === "yellow") {
      const currentNumbers = color === "red" ? red : yellow;
      // For last number (12), also check that we have at least 5 numbers already
      if (num === 12) {
        return (
          currentNumbers.every((n) => n < num) && currentNumbers.length >= 5
        );
      }
      return currentNumbers.every((n) => n < num);
    } else {
      const currentNumbers = color === "green" ? green : blue;
      // For last number (2), also check that we have at least 5 numbers already
      if (num === 2) {
        return (
          currentNumbers.every((n) => n > num) && currentNumbers.length >= 5
        );
      }
      return currentNumbers.every((n) => n > num);
    }
  };

  // Generate red row numbers (2-12)
  const renderRedRow = () => {
    const numbers = [];
    for (let i = 2; i <= 12; i++) {
      numbers.push(
        <td
          key={`red-${i}`}
          className={`${i === 2 ? "first" : i === 12 ? "last" : ""} ${
            i === 12 && isRowLocked("red") ? "locked-cell" : ""
          }`}
        >
          <motion.div
            variants={checkboxVariants}
            animate={red.includes(i) ? "checked" : "unchecked"}
          >
            <Checkbox
              id={`red-${i}`}
              className={`red-checkbox bg-white/20 ${
                i === 12 && isRowLocked("red") ? "locked-checkbox" : ""
              }`}
              checked={red.includes(i)}
              disabled={!canSelectNumber("red", i)}
              onCheckedChange={(checked) =>
                handleAscendingNumberToggle("red", i, !!checked)
              }
              onClick={(event) => {
                if (!red.includes(i) && i === 12 && red.length >= 5 && canSelectNumber("red", i)) {
                  handleAscendingNumberToggle("red", i, true, event);
                }
              }}
            />
          </motion.div>
          {i === 12 && isRowLocked("red") && (
            <motion.span
              className="lock-indicator"
              variants={starVariants}
              initial="initial"
              animate="animate"
            >
              ★
            </motion.span>
          )}
        </td>
      );
    }
    return numbers;
  };

  // Generate yellow row numbers (2-12)
  const renderYellowRow = () => {
    const numbers = [];
    for (let i = 2; i <= 12; i++) {
      numbers.push(
        <td
          key={`yellow-${i}`}
          className={`${i === 2 ? "first" : i === 12 ? "last" : ""} ${
            i === 12 && isRowLocked("yellow") ? "locked-cell" : ""
          }`}
        >
          <motion.div
            variants={checkboxVariants}
            animate={yellow.includes(i) ? "checked" : "unchecked"}
          >
            <Checkbox
              id={`yellow-${i}`}
              className={`yellow-checkbox bg-white/20 ${
                i === 12 && isRowLocked("yellow") ? "locked-checkbox" : ""
              }`}
              checked={yellow.includes(i)}
              disabled={!canSelectNumber("yellow", i)}
              onCheckedChange={(checked) =>
                handleAscendingNumberToggle("yellow", i, !!checked)
              }
              onClick={(event) => {
                if (!yellow.includes(i) && i === 12 && yellow.length >= 5 && canSelectNumber("yellow", i)) {
                  handleAscendingNumberToggle("yellow", i, true, event);
                }
              }}
            />
          </motion.div>
          {i === 12 && isRowLocked("yellow") && (
            <motion.span
              className="lock-indicator"
              variants={starVariants}
              initial="initial"
              animate="animate"
            >
              ★
            </motion.span>
          )}
        </td>
      );
    }
    return numbers;
  };

  // Generate green row numbers (12-2)
  const renderGreenRow = () => {
    const numbers = [];
    for (let i = 12; i >= 2; i--) {
      numbers.push(
        <td
          key={`green-${i}`}
          className={`${i === 12 ? "first" : i === 2 ? "last" : ""} ${
            i === 2 && isRowLocked("green") ? "locked-cell" : ""
          }`}
        >
          <motion.div
            variants={checkboxVariants}
            animate={green.includes(i) ? "checked" : "unchecked"}
          >
            <Checkbox
              id={`green-${i}`}
              className={`green-checkbox bg-white/20 ${
                i === 2 && isRowLocked("green") ? "locked-checkbox" : ""
              }`}
              checked={green.includes(i)}
              disabled={!canSelectNumber("green", i)}
              onCheckedChange={(checked) =>
                handleDescendingNumberToggle("green", i, !!checked)
              }
              onClick={(event) => {
                if (!green.includes(i) && i === 2 && green.length >= 5 && canSelectNumber("green", i)) {
                  handleDescendingNumberToggle("green", i, true, event);
                }
              }}
            />
          </motion.div>
          {i === 2 && isRowLocked("green") && (
            <motion.span
              className="lock-indicator"
              variants={starVariants}
              initial="initial"
              animate="animate"
            >
              ★
            </motion.span>
          )}
        </td>
      );
    }
    return numbers;
  };

  // Generate blue row numbers (12-2)
  const renderBlueRow = () => {
    const numbers = [];
    for (let i = 12; i >= 2; i--) {
      numbers.push(
        <td
          key={`blue-${i}`}
          className={`${i === 12 ? "first" : i === 2 ? "last" : ""} ${
            i === 2 && isRowLocked("blue") ? "locked-cell" : ""
          }`}
        >
          <motion.div
            variants={checkboxVariants}
            animate={blue.includes(i) ? "checked" : "unchecked"}
          >
            <Checkbox
              id={`blue-${i}`}
              className={`blue-checkbox bg-white/20 ${
                i === 2 && isRowLocked("blue") ? "locked-checkbox" : ""
              }`}
              checked={blue.includes(i)}
              disabled={!canSelectNumber("blue", i)}
              onCheckedChange={(checked) =>
                handleDescendingNumberToggle("blue", i, !!checked)
              }
              onClick={(event) => {
                if (!blue.includes(i) && i === 2 && blue.length >= 5 && canSelectNumber("blue", i)) {
                  handleDescendingNumberToggle("blue", i, true, event);
                }
              }}
            />
          </motion.div>
          {i === 2 && isRowLocked("blue") && (
            <motion.span
              className="lock-indicator"
              variants={starVariants}
              initial="initial"
              animate="animate"
            >
              ★
            </motion.span>
          )}
        </td>
      );
    }
    return numbers;
  };

  return (
    <motion.div
      className="qwixx-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <table className="qwixx-table">
        <tbody>
          <motion.tr
            className="red-row"
            variants={tableRowVariants}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            {renderRedRow()}
          </motion.tr>
          <motion.tr
            className="numbers-row"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {[...Array(11)].map((_, i) => (
              <th key={`header-ascending-${i + 2}`}>{i + 2}</th>
            ))}
          </motion.tr>
          <motion.tr
            className="yellow-row"
            variants={tableRowVariants}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            {renderYellowRow()}
          </motion.tr>
          <motion.tr
            className="green-row"
            variants={tableRowVariants}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            {renderGreenRow()}
          </motion.tr>
          <motion.tr
            className="numbers-row"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {[...Array(11)].map((_, i) => (
              <th key={`header-descending-${12 - i}`}>{12 - i}</th>
            ))}
          </motion.tr>
          <motion.tr
            className="blue-row"
            variants={tableRowVariants}
            initial="hidden"
            animate="visible"
            custom={3}
          >
            {renderBlueRow()}
          </motion.tr>
        </tbody>
      </table>

      {/* Bonus point animation */}
      {showBonusAnimation.active && (
        <motion.div 
          className="bonus-point-animation"
          initial="hidden"
          animate="visible"
          variants={bonusAnimationVariants}
          style={{
            position: "fixed",
            left: showBonusAnimation.x,
            top: showBonusAnimation.y,
            color: showBonusAnimation.color,
            pointerEvents: "none",
            fontWeight: "bold",
            fontSize: "24px",
            zIndex: 100,
            textShadow: "0px 0px 5px white",
          }}
        >
          +1
        </motion.div>
      )}

      {/* Penalty button with indicator */}
      <motion.div
        className="penalties-container mt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <motion.div animate={controls} className="flex flex-col items-center">
          <motion.div
            className={`penalty-progress mb-2 ${
              penalties >= MAX_PENALTIES ? "penalty-max" : ""
            }`}
          >
            {[...Array(MAX_PENALTIES)].map((_, i) => (
              <motion.div
                key={`penalty-indicator-${i}`}
                className={`penalty-dot ${
                  i < penalties ? "penalty-dot-active" : ""
                }`}
                initial={{ scale: 0 }}
                animate={{ scale: i < penalties ? 1 : 0.6 }}
                transition={{
                  delay: i * 0.1,
                  type: "spring",
                  stiffness: 500,
                  damping: 15,
                }}
              />
            ))}
          </motion.div>
          <motion.div
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <Button
              className={`penalty-button ${
                penalties >= MAX_PENALTIES ? "penalty-max-button" : ""
              }`}
              onClick={handleAddPenalty}
              disabled={penalties >= MAX_PENALTIES}
            >
              {penalties >= MAX_PENALTIES ? "Max Penalties" : "Add Penalty"}
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div
        className="mt-4"
        variants={scoreVariants}
        initial="hidden"
        animate={isScoreVisible ? "visible" : "hidden"}
      >
        <div className="scores-container">
          <Input
            className="red-score w-16 text-center"
            value={calculatePoints(red.length).toString()}
            readOnly
          />
          <span className="mt-2">+</span>
          <Input
            className="yellow-score w-16 text-center"
            value={calculatePoints(yellow.length).toString()}
            readOnly
          />
          <span className="mt-2">+</span>
          <Input
            className="green-score w-16 text-center"
            value={calculatePoints(green.length).toString()}
            readOnly
          />
          <span className="mt-2">+</span>
          <Input
            className="blue-score w-16 text-center"
            value={calculatePoints(blue.length).toString()}
            readOnly
          />
          <span className="mt-2">+</span>
          <Input
            className="bonus-score w-16 text-center bg-green-50 border-green-300"
            value={(
              (isRowLocked("red") ? 1 : 0) +
              (isRowLocked("yellow") ? 1 : 0) +
              (isRowLocked("green") ? 1 : 0) +
              (isRowLocked("blue") ? 1 : 0)
            ).toString()}
            readOnly
            title="Bonus points for locked rows"
          />
          <span className="mt-2">-</span>
          <Input
            className="penalty-score w-16 text-center"
            value={Math.abs(penalties * 5).toString()}
            readOnly
          />
          <span className="mt-2">=</span>
          <Input
            className="total w-24 text-center font-bold"
            value={calculateTotalScore().toString()}
            readOnly
          />
        </div>
      </motion.div>

      <motion.div
        className="mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
          <Button
            className="reset-button bg-gray-300 text-black transform transition-all duration-300 hover:bg-gray-400 hover:shadow-md"
            onClick={handleReset}
          >
            Reset Game
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        className="mt-8 p-4 border border-gray-200 rounded-md bg-gray-50 shadow-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        whileHover={{ boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
      >
        <motion.h3
          className="font-semibold mb-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.5 }}
        >
          Points Breakdown
        </motion.h3>
        <div className="text-sm grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num, index) => {
            const points = calculatePoints(num);
            return (
              <motion.div
                key={`points-${num}`}
                className="flex justify-between border-b border-gray-100 pb-1"
                initial={{ opacity: 0, x: index % 2 === 0 ? -10 : 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.0 + index * 0.05, duration: 0.3 }}
                whileHover={{ scale: 1.02 }}
              >
                <span>
                  {num} {num === 1 ? "mark" : "marks"}:{" "}
                </span>
                <span className="font-medium">{points} points</span>
              </motion.div>
            );
          })}
        </div>
        <motion.div
          className="mt-3 text-sm flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.5 }}
        >
          <span className="px-3 py-1 bg-gray-200 rounded-full">
            Each penalty (X): -5 points
          </span>
          <motion.span
            className="px-3 py-1 bg-green-100 rounded-full text-green-800"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.4, duration: 0.3, type: "spring" }}
          >
            Locked row (★): +1 bonus point
          </motion.span>
        </motion.div>
      </motion.div>

      <motion.footer
        className="qwixx-footer mt-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
      >
        <p>
          Qwixx is designed by Steffen Benndorf and published by{" "}
          <motion.a
            href="https://www.nsv.de/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 underline"
            whileHover={{ scale: 1.05 }}
          >
            Nürnberger Spielkarten Verlag
          </motion.a>
          . If you wish to purchase your own copy, look for local game stores.
        </p>
      </motion.footer>
    </motion.div>
  );
};

export default QwixxScorecard;
