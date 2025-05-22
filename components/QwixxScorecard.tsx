"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerOverlay,
  DrawerPortal,
} from "@/components/ui/drawer";
import { motion, useAnimation, Variants } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import { RotateCcw, PlusCircle, Eye, EyeOff } from "lucide-react";

// Custom hook for media query
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    window.addEventListener("resize", listener);
    return () => window.removeEventListener("resize", listener);
  }, [matches, query]);

  return matches;
}

const QwixxScorecard = () => {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // State for each color row
  const [red, setRed] = useState<number[]>([]);
  const [yellow, setYellow] = useState<number[]>([]);
  const [green, setGreen] = useState<number[]>([]);
  const [blue, setBlue] = useState<number[]>([]);

  // State for penalties
  const [penalties, setPenalties] = useState<number>(0);

  // Animation states
  const [isScoreVisible, setIsScoreVisible] = useState<boolean>(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

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
        ease: "easeOut",
      },
    },
  };

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

    // Penalty points
    const penaltyPoints = penalties * 5;

    return baseScore - penaltyPoints;
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

        // If ticking the last number, add it twice (counts as two marks)
        if (num === 12) {
          setter([...currentNumbers, num, num].sort((a, b) => a - b));
        } else {
          setter([...currentNumbers, num].sort((a, b) => a - b));
        }

        // If locking the row, show bonus animation
        if (willLock && event) {
          const rect = (event.target as HTMLElement).getBoundingClientRect();
          setShowBonusAnimation({
            active: true,
            color: color === "red" ? "#ff3b30" : "#ffcc00",
            x: rect.left + rect.width / 2,
            y: rect.top,
          });

          // Reset animation after it completes
          setTimeout(() => {
            setShowBonusAnimation((prev) => ({ ...prev, active: false }));
          }, 1500);
        }
      }
    } else {
      // Can only uncheck if it's the highest number
      if (Math.max(...currentNumbers) === num) {
        // If unticking the last number (12), remove all instances of it (to remove both marks if it was a double-tick)
        if (num === 12) {
          setter(currentNumbers.filter((n) => n !== num));
        } else {
          // For other numbers, remove only the specific instance
          const index = currentNumbers.lastIndexOf(num);
          if (index !== -1) {
            currentNumbers.splice(index, 1);
            setter(currentNumbers);
          }
        }
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

        // If ticking the last number, add it twice (counts as two marks)
        if (num === 2) {
          setter([...currentNumbers, num, num].sort((a, b) => b - a));
        } else {
          setter([...currentNumbers, num].sort((a, b) => b - a));
        }

        // If locking the row, show bonus animation
        if (willLock && event) {
          const rect = (event.target as HTMLElement).getBoundingClientRect();
          setShowBonusAnimation({
            active: true,
            color: color === "green" ? "#34c759" : "#007aff",
            x: rect.left + rect.width / 2,
            y: rect.top,
          });

          // Reset animation after it completes
          setTimeout(() => {
            setShowBonusAnimation((prev) => ({ ...prev, active: false }));
          }, 1500);
        }
      }
    } else {
      // Can only uncheck if it's the lowest number
      if (Math.min(...currentNumbers) === num) {
        // If unticking the last number (2), remove all instances of it (to remove both marks if it was a double-tick)
        if (num === 2) {
          setter(currentNumbers.filter((n) => n !== num));
        } else {
          // For other numbers, remove only the specific instance
          const index = currentNumbers.lastIndexOf(num);
          if (index !== -1) {
            currentNumbers.splice(index, 1);
            setter(currentNumbers);
          }
        }
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

  // Check if number can be selected or unticked (for unticking, allow the last ticked number to be enabled)
  const canSelectNumber = (
    color: "red" | "yellow" | "green" | "blue",
    num: number
  ): boolean => {
    const currentNumbers = {
      red: red,
      yellow: yellow,
      green: green,
      blue: blue,
    }[color];

    const isLastNumber =
      color === "red" || color === "yellow" ? num === 12 : num === 2;

    // If the number is already ticked
    if (currentNumbers.includes(num)) {
      if (isLastNumber) {
        // The special last number (12 or 2) can always be unticked if it's present.
        // This handles cases where it's ticked once or twice (for the double mark).
        return true;
      } else {
        // For other ticked numbers, it must be the highest/lowest in the sequence to be unticked.
        if (color === "red" || color === "yellow") {
          return Math.max(...currentNumbers) === num;
        } else {
          // green or blue
          return Math.min(...currentNumbers) === num;
        }
      }
    } else {
      // If the number is NOT ticked yet (i.e., we're considering ticking it):
      // 1. Row must not be locked to tick a new number.
      if (isRowLocked(color)) return false;

      // 2. Standard progression rules apply.
      if (color === "red" || color === "yellow") {
        if (num === 12) {
          // Ticking 12 (last number for ascending)
          return (
            currentNumbers.every((n) => n < num) && currentNumbers.length >= 5
          );
        }
        // Ticking other numbers for ascending rows
        return currentNumbers.every((n) => n < num);
      } else {
        // green or blue
        if (num === 2) {
          // Ticking 2 (last number for descending)
          return (
            currentNumbers.every((n) => n > num) && currentNumbers.length >= 5
          );
        }
        // Ticking other numbers for descending rows
        return currentNumbers.every((n) => n > num);
      }
    }
  };

  const handleToggleFactory = (color: "red" | "yellow" | "green" | "blue") => {
    return (
      num: number,
      currentIsTicked: boolean,
      event?: React.MouseEvent
    ) => {
      if (color === "red" || color === "yellow") {
        handleAscendingNumberToggle(color, num, !currentIsTicked, event);
      } else {
        handleDescendingNumberToggle(
          color as "green" | "blue",
          num,
          !currentIsTicked,
          event
        );
      }
    };
  };

  const renderRowCells = (
    color: "red" | "yellow" | "green" | "blue",
    numbersArray: number[],
    isAscending: boolean
  ) => {
    const stateArray = {
      red: red,
      yellow: yellow,
      green: green,
      blue: blue,
    }[color];

    const handleToggle = handleToggleFactory(color);

    const colorPalettes = {
      red: {
        untickedBg: "bg-red-200",
        untickedText: "text-red-900",
        untickedHover: "hover:bg-red-300",
        tickedBg: "bg-red-400",
        tickedText: "text-white",
        tickedHover: "hover:bg-red-500",
      },
      yellow: {
        untickedBg: "bg-yellow-200",
        untickedText: "text-yellow-900",
        untickedHover: "hover:bg-yellow-300",
        tickedBg: "bg-yellow-300",
        tickedText: "text-black",
        tickedHover: "hover:bg-yellow-400",
      },
      green: {
        untickedBg: "bg-green-200",
        untickedText: "text-green-900",
        untickedHover: "hover:bg-green-300",
        tickedBg: "bg-green-400",
        tickedText: "text-white",
        tickedHover: "hover:bg-green-500",
      },
      blue: {
        untickedBg: "bg-blue-200",
        untickedText: "text-blue-900",
        untickedHover: "hover:bg-blue-300",
        tickedBg: "bg-blue-400",
        tickedText: "text-white",
        tickedHover: "hover:bg-blue-500",
      },
    };

    const palette = colorPalettes[color];

    return numbersArray.map((num, index, arr) => {
      const isTicked = stateArray.includes(num);
      const canCurrentlySelect = canSelectNumber(color, num);
      const isDisabledForNewTick = !canCurrentlySelect && !isTicked;

      let latestTickCondition;
      if (isAscending) {
        latestTickCondition =
          isTicked &&
          Math.max(...stateArray.filter((n) => typeof n === "number")) ===
            num &&
          stateArray.filter((n) => n === num).length > 0;
        if (num === 12 && stateArray.filter((n) => n === 12).length > 1)
          latestTickCondition = true; // Ensure double marked 12 shows ring
      } else {
        latestTickCondition =
          isTicked &&
          Math.min(...stateArray.filter((n) => typeof n === "number")) ===
            num &&
          stateArray.filter((n) => n === num).length > 0;
        if (num === 2 && stateArray.filter((n) => n === 2).length > 1)
          latestTickCondition = true; // Ensure double marked 2 shows ring
      }

      let cellClasses =
        "w-12 h-12 rounded-md font-bold text-xl transition-all duration-150 cursor-pointer px-2";
      const textContainerClasses =
        "w-full h-full flex items-center justify-center";

      if (isTicked) {
        cellClasses += ` ${palette.tickedBg} ${palette.tickedText}`;
        if (canCurrentlySelect) {
          // Only allow hover if it's the one that can be unticked
          cellClasses += ` ${palette.tickedHover}`;
        }
        if (latestTickCondition) {
          cellClasses += " opacity-100";
        } else {
          cellClasses += " opacity-60";
        }
      } else {
        cellClasses += ` ${palette.untickedBg} ${palette.untickedText}`;
        if (canCurrentlySelect) {
          cellClasses += ` ${palette.untickedHover}`;
        }
      }

      if (isDisabledForNewTick) {
        cellClasses += " opacity-20 cursor-not-allowed";
      }

      // Add specific rounding for first/last cells in the visual row
      if (index === 0)
        cellClasses += isAscending ? " rounded-l-md" : " rounded-l-md"; // All rows start left
      if (index === arr.length - 1)
        cellClasses += isAscending ? " rounded-r-md" : " rounded-r-md"; // All rows end right

      return (
        <td
          key={`${color}-${num}`}
          className={cellClasses}
          onClick={(e) => {
            if (canCurrentlySelect || isTicked) {
              handleToggle(num, isTicked, e);
            }
          }}
        >
          <div
            className={textContainerClasses}
            style={{ position: "relative", width: "100%", height: "100%" }}
          >
            {num}
            {/* Star for locked row on last cell */}
            {(color === "red" || color === "yellow") &&
              num === 12 &&
              isRowLocked(color) && (
                <span className="absolute -right-1 -bottom-1 text-yellow-400 z-10 text-2xl drop-shadow">
                  ★
                </span>
              )}
            {(color === "green" || color === "blue") &&
              num === 2 &&
              isRowLocked(color) && (
                <span className="absolute -right-1 -bottom-1 text-yellow-400 z-10 text-2xl drop-shadow">
                  ★
                </span>
              )}
          </div>
        </td>
      );
    });
  };

  const redNumbers = Array.from({ length: 11 }, (_, i) => i + 2); // 2 to 12
  const yellowNumbers = Array.from({ length: 11 }, (_, i) => i + 2); // 2 to 12
  const greenNumbers = Array.from({ length: 11 }, (_, i) => 12 - i); // 12 to 2
  const blueNumbers = Array.from({ length: 11 }, (_, i) => 12 - i); // 12 to 2

  return (
    <motion.div
      className="w-full max-w-[600px] mx-auto text-[22px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <table className="w-full border-separate border-spacing-y-3 border-spacing-x-2 mb-2">
        <tbody className="space-y-2">
          <motion.tr
            variants={tableRowVariants}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            {renderRowCells("red", redNumbers, true)}
          </motion.tr>
          <motion.tr
            variants={tableRowVariants}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            {renderRowCells("yellow", yellowNumbers, true)}
          </motion.tr>
          <motion.tr
            variants={tableRowVariants}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            {renderRowCells("green", greenNumbers, false)}
          </motion.tr>
          <motion.tr
            variants={tableRowVariants}
            initial="hidden"
            animate="visible"
            custom={3}
          >
            {renderRowCells("blue", blueNumbers, false)}
          </motion.tr>
        </tbody>
      </table>

      {/* Main Action Buttons Row */}
      <motion.div
        className="mt-6 flex flex-row justify-center items-center space-x-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        {/* Reset Game Button (Left) with Confirmation */}
        {isDesktop ? (
          <Dialog
            open={isResetConfirmOpen}
            onOpenChange={setIsResetConfirmOpen}
          >
            <DialogTrigger asChild>
              <Button
                id="reset-game-button"
                variant="destructive"
                className="transition duration-150 ease-in-out hover:scale-105 active:scale-95"
              >
                <RotateCcw className="mr-2" />
                Reset Game
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Confirm Reset</DialogTitle>
                <DialogDescription>
                  Are you sure you want to reset the game? All current scores
                  and marks will be lost.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button
                    variant="outline"
                    className="transition duration-150 ease-in-out hover:scale-105 active:scale-95"
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  className="transition duration-150 ease-in-out hover:scale-105 active:scale-95"
                  onClick={() => {
                    handleReset();
                    setIsResetConfirmOpen(false);
                  }}
                >
                  <RotateCcw className="mr-2" />
                  Confirm Reset
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <Drawer
            open={isResetConfirmOpen}
            onOpenChange={setIsResetConfirmOpen}
          >
            <DrawerTrigger asChild>
              <Button
                id="reset-game-button-mobile"
                variant="destructive"
                className="transition duration-150 ease-in-out hover:scale-105 active:scale-95"
              >
                <RotateCcw className="mr-2" />
                Reset Game
              </Button>
            </DrawerTrigger>
            <DrawerPortal>
              <DrawerOverlay />
              <DrawerContent>
                <DrawerHeader className="text-left">
                  <DrawerTitle>Confirm Reset</DrawerTitle>
                  <DrawerDescription>
                    Are you sure you want to reset the game? All current scores
                    and marks will be lost.
                  </DrawerDescription>
                </DrawerHeader>
                <DrawerFooter className="pt-2">
                  <Button
                    variant="destructive"
                    className="transition duration-150 ease-in-out hover:scale-105 active:scale-95"
                    onClick={() => {
                      handleReset();
                      setIsResetConfirmOpen(false);
                    }}
                  >
                    <RotateCcw className="mr-2" />
                    Confirm Reset
                  </Button>
                  <DrawerClose asChild>
                    <Button
                      variant="outline"
                      className="transition duration-150 ease-in-out hover:scale-105 active:scale-95"
                    >
                      Cancel
                    </Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </DrawerPortal>
          </Drawer>
        )}

        {/* Add Penalty Button (Center) */}
        <Button
          id="add-penalty-button"
          className="transition duration-150 ease-in-out hover:scale-105 active:scale-95"
          onClick={handleAddPenalty}
          disabled={penalties >= MAX_PENALTIES}
        >
          <PlusCircle className="mr-2" />
          {penalties >= MAX_PENALTIES ? "Max Penalties" : "Add Penalty"}
        </Button>

        {/* Show/Hide Scores Button (Right) */}
        <Button
          id="toggle-scores-button"
          variant="default"
          className="transition duration-150 ease-in-out hover:scale-105 active:scale-95"
          onClick={() => setIsScoreVisible(!isScoreVisible)}
        >
          {isScoreVisible ? (
            <EyeOff className="mr-2" />
          ) : (
            <Eye className="mr-2" />
          )}
          {isScoreVisible ? "Hide Scores" : "Show Scores"}
        </Button>
      </motion.div>

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

      {/* Penalty dots display (button moved to the row above) */}
      <motion.div
        className="penalties-dots-container mt-6" // Renamed class for clarity, if needed
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }} // Original delay for penalty section
      >
        <motion.div animate={controls} className="flex flex-col items-center">
          <motion.div
            className={`flex justify-center gap-2 mb-2 ${
              penalties >= MAX_PENALTIES ? "penalty-max" : ""
            }`}
          >
            {[...Array(MAX_PENALTIES)].map((_, i) => (
              <motion.div
                key={`penalty-indicator-${i}`}
                className={`w-3 h-3 rounded-full shadow-sm ${
                  i < penalties
                    ? "bg-red-500 shadow-[0_0_8px_rgba(255,59,48,0.5)]"
                    : "bg-gray-300"
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
          {/* The Add Penalty Button was here, now it's in the row above */}
        </motion.div>
      </motion.div>

      {/* Score calculation section, shown/hidden by isScoreVisible */}
      <motion.div
        className="mt-4"
        variants={scoreVariants}
        initial="hidden"
        animate={isScoreVisible ? "visible" : "hidden"}
      >
        <div className="scores-container flex items-center gap-2 mb-4 flex-wrap justify-center sm:justify-start">
          <Input
            id="red-score-display"
            className="w-16 text-center bg-red-200 border border-red-400"
            value={calculatePoints(red.length).toString()}
            readOnly
          />
          <span>+</span>
          <Input
            id="yellow-score-display"
            className="w-16 text-center bg-yellow-200 border border-yellow-400"
            value={calculatePoints(yellow.length).toString()}
            readOnly
          />
          <span>+</span>
          <Input
            id="green-score-display"
            className="w-16 text-center bg-green-200 border border-green-400"
            value={calculatePoints(green.length).toString()}
            readOnly
          />
          <span>+</span>
          <Input
            id="blue-score-display"
            className="w-16 text-center bg-blue-200 border border-blue-400"
            value={calculatePoints(blue.length).toString()}
            readOnly
          />
          <span>-</span>
          <Input
            id="penalty-score-display"
            className="w-16 text-center bg-muted border border-border"
            value={Math.abs(penalties * 5).toString()}
            readOnly
          />
          <span className="mt-2">=</span>
          <Input
            id="total-score-display"
            className="w-24 text-center font-bold border border-border bg-background text-foreground"
            value={calculateTotalScore().toString()}
            readOnly
          />
        </div>
      </motion.div>

      {/* Points Breakdown Section, shown/hidden by isScoreVisible */}
      <motion.div
        className="mt-8 p-4 border border-border rounded-md bg-muted shadow-sm"
        variants={scoreVariants}
        initial="hidden"
        animate={isScoreVisible ? "visible" : "hidden"}
        whileHover={{ boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
      >
        <motion.h3
          className="font-semibold mb-4 text-center text-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: isScoreVisible ? 1 : 0 }}
          transition={{ delay: isScoreVisible ? 0.1 : 0, duration: 0.5 }}
        >
          Points Breakdown
        </motion.h3>
        <div className="w-full max-w-3xl mx-auto">
          <div className="grid grid-cols-12 gap-1 mb-1">
            {[...Array(12)].map((_, i) => (
              <div
                key={`tick-label-${i}`}
                className="rounded-md bg-background text-foreground text-xs sm:text-sm font-semibold flex items-center justify-center border border-border py-1"
              >
                {i + 1}x
              </div>
            ))}
          </div>
          <div className="grid grid-cols-12 gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num, i) => (
              <div
                key={`tick-points-${i}`}
                className="rounded-md bg-background text-foreground text-xs sm:text-sm flex items-center justify-center border border-border py-1"
              >
                {calculatePoints(num)}
              </div>
            ))}
          </div>
        </div>
        <motion.div
          className="mt-3 text-sm flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: isScoreVisible ? 1 : 0 }}
          transition={{ delay: isScoreVisible ? 0.4 : 0, duration: 0.5 }}
        >
          <span className="px-3 py-1 bg-muted rounded-full text-muted-foreground">
            Each penalty (X): -5 points
          </span>
        </motion.div>
      </motion.div>

      <motion.footer
        className="text-[0.8rem] text-muted-foreground mt-8 text-center"
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
