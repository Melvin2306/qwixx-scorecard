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
import { useEffect, useState, useCallback, useRef, memo } from "react";
import {
  RotateCcw,
  PlusCircle,
  Eye,
  EyeOff,
  Info,
  Lock,
  Unlock,
  Trophy,
  Flag,
  ChevronLeft,
} from "lucide-react";
import {
  Dialog as InfoDialog,
  DialogContent as InfoDialogContent,
  DialogHeader as InfoDialogHeader,
  DialogTitle as InfoDialogTitle,
  DialogTrigger as InfoDialogTrigger,
} from "@/components/ui/dialog";

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

// Define the game state type
type RowColor = "red" | "yellow" | "green" | "blue";
type LockedRows = { [color in RowColor]: boolean };
type GameState = {
  red: number[];
  yellow: number[];
  green: number[];
  blue: number[];
  lockedRows: LockedRows;
  penalties: number;
};

const initialGameState: GameState = {
  red: [],
  yellow: [],
  green: [],
  blue: [],
  lockedRows: {
    red: false,
    yellow: false,
    green: false,
    blue: false,
  },
  penalties: 0,
};

const GAME_STATE_KEY = "qwixx-game-state";

// Define the QwixxCell props type
type QwixxCellProps = {
  color: RowColor;
  num: number;
  isTicked: boolean;
  canCurrentlySelect: boolean;
  isDisabledForNewTick: boolean;
  isLastCell: boolean;
  isLocked: boolean;
  isLastNumberTicked: boolean;
  latestTickCondition: boolean;
  handleToggle: (num: number, isTicked: boolean, e: React.MouseEvent) => void;
  isDesktop: boolean;
  cellClasses: string;
  textContainerClasses: string;
  tooltipMessage: string;
  isPenaltyHolding: boolean;
};

// Memoized QwixxCell component
const QwixxCell = memo(function QwixxCell({
  color,
  num,
  isTicked,
  canCurrentlySelect,
  isDisabledForNewTick,
  isLastCell,
  isLocked,
  isLastNumberTicked,
  latestTickCondition,
  handleToggle,
  isDesktop,
  cellClasses,
  textContainerClasses,
  tooltipMessage,
  isPenaltyHolding,
}: QwixxCellProps) {
  return (
    <td
      className={
        isLocked
          ? `${cellClasses.replace(
              /opacity-\d{2,3}/g,
              ""
            )} cursor-not-allowed relative ${
              isLastCell ? "overflow-visible" : "overflow-hidden"
            } rounded-md animate-lock-row`
          : `${cellClasses.replace(/opacity-\d{2,3}/g, "")} ${
              isLastCell ? "overflow-visible" : "overflow-hidden"
            } rounded-md`
      }
      onClick={(e) => {
        if (!isLocked && (canCurrentlySelect || isTicked)) {
          handleToggle(num, isTicked, e);
        }
      }}
    >
      <div className="relative w-full h-full">
        {/* Lock overlay */}
        {isLocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none backdrop-blur"
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
              }}
              className={`text-4xl drop-shadow-lg z-40 ${
                color === "red"
                  ? "text-red-700"
                  : color === "yellow"
                  ? "text-yellow-700"
                  : color === "green"
                  ? "text-green-700"
                  : "text-blue-700"
              } drop-shadow`}
              role="img"
              aria-label="locked"
            >
              <Lock />
            </motion.span>
          </motion.div>
        )}
        {/* Star for locked row on last cell - always on top */}
        {((color === "red" && num === 12) ||
          (color === "yellow" && num === 12) ||
          (color === "green" && num === 2) ||
          (color === "blue" && num === 2)) &&
          isLastNumberTicked && (
            <span className="absolute -right-6 -top-4 text-yellow-400 z-50 text-4xl drop-shadow pointer-events-none">
              ★
            </span>
          )}
        {isLastCell && isDisabledForNewTick ? (
          isDesktop ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="group relative w-full h-full flex items-center justify-center">
                <span className="absolute z-20 left-1/2 top-0 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded bg-muted px-2 py-1 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition pointer-events-none shadow-lg border border-border">
                  {tooltipMessage}
                </span>
                <span
                  className={
                    textContainerClasses +
                    (cellClasses.includes("opacity-")
                      ? " " + (cellClasses.match(/opacity-\d{2,3}/)?.[0] ?? "")
                      : "")
                  }
                >
                  {num}
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <InfoDialog>
                <InfoDialogTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1 text-inherit focus:outline-none"
                    onMouseDown={(e) => {
                      if (isPenaltyHolding) {
                        e.preventDefault();
                        e.stopPropagation();
                        if (document.activeElement instanceof HTMLElement) {
                          document.activeElement.blur();
                        }
                      }
                    }}
                    onTouchStart={(e) => {
                      if (isPenaltyHolding) {
                        e.preventDefault();
                        e.stopPropagation();
                        if (document.activeElement instanceof HTMLElement) {
                          document.activeElement.blur();
                        }
                      }
                    }}
                  >
                    <span
                      className={
                        textContainerClasses +
                        (cellClasses.includes("opacity-")
                          ? " " +
                            (cellClasses.match(/opacity-\d{2,3}/)?.[0] ?? "")
                          : "")
                      }
                    >
                      {num}
                    </span>
                    <Info className="ml-1 w-4 h-4 text-muted-foreground" />
                  </button>
                </InfoDialogTrigger>
                <InfoDialogContent className="max-w-xs">
                  <InfoDialogHeader>
                    <InfoDialogTitle>Why is this disabled?</InfoDialogTitle>
                  </InfoDialogHeader>
                  <div className="text-sm text-muted-foreground">
                    {tooltipMessage}
                  </div>
                </InfoDialogContent>
              </InfoDialog>
            </div>
          )
        ) : (
          <div
            className={textContainerClasses}
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
            }}
          >
            <span
              className={
                cellClasses.includes("opacity-")
                  ? cellClasses.match(/opacity-\d{2,3}/)?.[0] ?? ""
                  : ""
              }
            >
              {num}
            </span>
          </div>
        )}
      </div>
    </td>
  );
});

const QwixxScorecard = () => {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // --- Game State ---
  const [gameState, setGameState] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(GAME_STATE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return initialGameState;
        }
      }
    }
    return initialGameState;
  });

  // Sync gameState to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(GAME_STATE_KEY, JSON.stringify(gameState));
    }
  }, [gameState]);

  // --- State accessors for convenience ---
  const { red, yellow, green, blue, lockedRows, penalties } = gameState;

  // Max penalties before game ends
  const MAX_PENALTIES = 4;

  // Game over state
  const [gameOver, setGameOver] = useState(false);
  const [showGameOverDialog, setShowGameOverDialog] = useState(false);

  // Detect game over
  useEffect(() => {
    const lockedCount = Object.values(lockedRows).filter(Boolean).length;
    if (penalties >= MAX_PENALTIES || lockedCount >= 2) {
      setGameOver(true);
      setShowGameOverDialog(true);
    } else {
      setGameOver(false);
    }
  }, [penalties, lockedRows]);

  // Animation states
  const [isScoreVisible, setIsScoreVisible] = useState<boolean>(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [showBonusAnimation, setShowBonusAnimation] = useState<{
    active: boolean;
    color: string;
    x: number;
    y: number;
  }>({ active: false, color: "", x: 0, y: 0 });

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
    return lockedRows[color];
  };

  // --- State update helpers ---
  const updateRow = (color: RowColor, newArr: number[]) => {
    setGameState((prev: GameState) => ({ ...prev, [color]: newArr }));
  };
  const updateLockedRows = (newLockedRows: LockedRows) => {
    setGameState((prev: GameState) => ({ ...prev, lockedRows: newLockedRows }));
  };
  const updatePenalties = (newPenalties: number) => {
    setGameState((prev: GameState) => ({ ...prev, penalties: newPenalties }));
  };

  // --- Handlers ---
  // Handle checking/unchecking a number in the ascending rows (red & yellow)
  const handleAscendingNumberToggle = (
    color: "red" | "yellow",
    num: number,
    checked: boolean,
    event?: React.MouseEvent<Element, MouseEvent>
  ) => {
    if (gameOver) return;
    const currentNumbers = [...gameState[color]];
    if (checked) {
      if (currentNumbers.every((n: number) => n < num)) {
        if (num === 12 && currentNumbers.length < 5) {
          return;
        }
        const willLock = num === 12 && currentNumbers.length >= 5;
        if (num === 12) {
          updateRow(
            color,
            [...currentNumbers, num, num].sort((a: number, b: number) => a - b)
          );
          if (willLock) {
            updateLockedRows({ ...lockedRows, [color]: true });
          }
        } else {
          updateRow(
            color,
            [...currentNumbers, num].sort((a: number, b: number) => a - b)
          );
        }
        if (willLock && event) {
          const rect = (event.target as HTMLElement).getBoundingClientRect();
          setShowBonusAnimation({
            active: true,
            color: color === "red" ? "#ff3b30" : "#ffcc00",
            x: rect.left + rect.width / 2,
            y: rect.top,
          });
          setTimeout(() => {
            setShowBonusAnimation((prev) => ({ ...prev, active: false }));
          }, 1500);
        }
      }
    } else {
      if (Math.max(...currentNumbers) === num) {
        if (num === 12) {
          updateRow(
            color,
            currentNumbers.filter((n: number) => n !== num)
          );
          updateLockedRows({ ...lockedRows, [color]: false });
        } else {
          const index = currentNumbers.lastIndexOf(num);
          if (index !== -1) {
            currentNumbers.splice(index, 1);
            updateRow(color, currentNumbers);
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
    if (gameOver) return;
    const currentNumbers = [...gameState[color]];
    if (checked) {
      if (currentNumbers.every((n: number) => n > num)) {
        if (num === 2 && currentNumbers.length < 5) {
          return;
        }
        const willLock = num === 2 && currentNumbers.length >= 5;
        if (num === 2) {
          updateRow(
            color,
            [...currentNumbers, num, num].sort((a: number, b: number) => b - a)
          );
          if (willLock) {
            updateLockedRows({ ...lockedRows, [color]: true });
          }
        } else {
          updateRow(
            color,
            [...currentNumbers, num].sort((a: number, b: number) => b - a)
          );
        }
        if (willLock && event) {
          const rect = (event.target as HTMLElement).getBoundingClientRect();
          setShowBonusAnimation({
            active: true,
            color: color === "green" ? "#34c759" : "#007aff",
            x: rect.left + rect.width / 2,
            y: rect.top,
          });
          setTimeout(() => {
            setShowBonusAnimation((prev) => ({ ...prev, active: false }));
          }, 1500);
        }
      }
    } else {
      if (Math.min(...currentNumbers) === num) {
        if (num === 2) {
          updateRow(
            color,
            currentNumbers.filter((n: number) => n !== num)
          );
        } else {
          const index = currentNumbers.lastIndexOf(num);
          if (index !== -1) {
            currentNumbers.splice(index, 1);
            updateRow(color, currentNumbers);
          }
        }
      }
    }
  };

  // Handle adding a penalty
  const handleAddPenalty = () => {
    if (gameOver) return;
    if (penalties < MAX_PENALTIES) {
      updatePenalties(penalties + 1);
      controls.start({
        scale: [1, 1.2, 1],
        transition: { duration: 0.3 },
      });
    }
  };

  // Handle reset
  const handleReset = () => {
    setGameState(initialGameState);
    if (typeof window !== "undefined") {
      localStorage.removeItem(GAME_STATE_KEY);
    }
    setGameOver(false);
    setShowGameOverDialog(false);
  };

  // Check if number can be selected or unticked (for unticking, allow the last ticked number to be enabled)
  const canSelectNumber = (
    color: "red" | "yellow" | "green" | "blue",
    num: number
  ): boolean => {
    if (isRowLocked(color)) return false;
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
            currentNumbers.every((n: number) => n < num) &&
            currentNumbers.length >= 5
          );
        }
        // Ticking other numbers for ascending rows
        return currentNumbers.every((n: number) => n < num);
      } else {
        // green or blue
        if (num === 2) {
          // Ticking 2 (last number for descending)
          return (
            currentNumbers.every((n: number) => n > num) &&
            currentNumbers.length >= 5
          );
        }
        // Ticking other numbers for descending rows
        return currentNumbers.every((n: number) => n > num);
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
        untickedText: "text-red-800",
        untickedHover: "hover:bg-red-300",
        tickedBg: "bg-red-500",
        tickedText: "text-white",
        tickedHover: "hover:bg-red-600",
      },
      yellow: {
        untickedBg: "bg-yellow-200",
        untickedText: "text-yellow-800",
        untickedHover: "hover:bg-yellow-300",
        tickedBg: "bg-yellow-600",
        tickedText: "text-white",
        tickedHover: "hover:bg-yellow-700",
      },
      green: {
        untickedBg: "bg-green-200",
        untickedText: "text-green-800",
        untickedHover: "hover:bg-green-300",
        tickedBg: "bg-green-500",
        tickedText: "text-white",
        tickedHover: "hover:bg-green-600",
      },
      blue: {
        untickedBg: "bg-blue-200",
        untickedText: "text-blue-800",
        untickedHover: "hover:bg-blue-300",
        tickedBg: "bg-blue-500",
        tickedText: "text-white",
        tickedHover: "hover:bg-blue-600",
      },
    };

    const palette = colorPalettes[color];

    // For red row, add lock button and lock indicator
    const isLocked = isRowLocked(color);

    // Color palette for lock button and overlay
    const lockButtonPalette = {
      red: {
        border: "border-red-400",
        bg: "bg-red-200",
        hover: "hover:bg-red-100",
        text: "text-red-500",
        icon: "text-red-700 drop-shadow",
      },
      yellow: {
        border: "border-yellow-400",
        bg: "bg-yellow-200",
        hover: "hover:bg-yellow-100",
        text: "text-yellow-500",
        icon: "text-yellow-700 drop-shadow",
      },
      green: {
        border: "border-green-400",
        bg: "bg-green-200",
        hover: "hover:bg-green-100",
        text: "text-green-500",
        icon: "text-green-700 drop-shadow",
      },
      blue: {
        border: "border-blue-400",
        bg: "bg-blue-200",
        hover: "hover:bg-blue-100",
        text: "text-blue-500",
        icon: "text-blue-700 drop-shadow",
      },
    }[color];

    // Show the star only if the last number is ticked (regardless of lock state)
    const isLastNumberTicked =
      color === "red" || color === "yellow"
        ? stateArray.filter((n: number) => n === 12).length > 0
        : stateArray.filter((n: number) => n === 2).length > 0;

    return (
      <>
        {numbersArray.map((num, index, arr) => {
          const isTicked = stateArray.includes(num);
          const canCurrentlySelect = !gameOver && canSelectNumber(color, num);
          const isDisabledForNewTick = !canCurrentlySelect && !isTicked;
          const isLastCell =
            (isAscending && num === 12) || (!isAscending && num === 2);

          let latestTickCondition;
          if (isAscending) {
            latestTickCondition =
              isTicked &&
              Math.max(
                ...stateArray.filter((n: number) => typeof n === "number")
              ) === num &&
              stateArray.filter((n: number) => n === num).length > 0;
            if (
              num === 12 &&
              stateArray.filter((n: number) => n === 12).length > 1
            )
              latestTickCondition = true; // Ensure double marked 12 shows ring
          } else {
            latestTickCondition =
              isTicked &&
              Math.min(
                ...stateArray.filter((n: number) => typeof n === "number")
              ) === num &&
              stateArray.filter((n: number) => n === num).length > 0;
            if (
              num === 2 &&
              stateArray.filter((n: number) => n === 2).length > 1
            )
              latestTickCondition = true; // Ensure double marked 2 shows ring
          }

          let cellClasses =
            "w-10 h-10 sm:w-12 sm:h-12 rounded-md font-bold text-lg sm:text-xl transition-all duration-150 cursor-pointer px-1 sm:px-2";
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

          // Tooltip/Info logic for last cell if disabled
          const tooltipMessage = "You need min 5 fields checked";

          return (
            <QwixxCell
              key={`${color}-${num}`}
              color={color}
              num={num}
              isTicked={isTicked}
              canCurrentlySelect={canCurrentlySelect}
              isDisabledForNewTick={isDisabledForNewTick}
              isLastCell={isLastCell}
              isLocked={isLocked}
              isLastNumberTicked={isLastNumberTicked}
              latestTickCondition={latestTickCondition}
              handleToggle={handleToggle}
              isDesktop={isDesktop}
              cellClasses={cellClasses}
              textContainerClasses={textContainerClasses}
              tooltipMessage={tooltipMessage}
              isPenaltyHolding={isPenaltyHolding}
            />
          );
        })}
        {/* Lock button at the end of the row for all colors */}
        <td key={`${color}-lock-btn-end`} className="pl-2 align-middle">
          <Button
            size="icon"
            variant={isLocked ? "secondary" : "outline"}
            className={`rounded-full border-2 ${
              lockButtonPalette.border
            } shadow transition-all duration-300 flex items-center justify-center ${
              lockButtonPalette.text
            } ${
              isLocked
                ? `${lockButtonPalette.bg} ${lockButtonPalette.border} animate-lock-pop`
                : lockButtonPalette.hover
            }`}
            aria-label={isLocked ? "Unlock row" : "Lock row"}
            onClick={() => {
              updateLockedRows({ ...lockedRows, [color]: !isLocked });
            }}
            onMouseDown={handleButtonInteraction}
            onTouchStart={handleButtonInteraction}
          >
            {isLocked ? (
              <Lock className={`w-6 h-6 ${lockButtonPalette.icon}`} />
            ) : (
              <Unlock className={`w-6 h-6 ${lockButtonPalette.icon}`} />
            )}
          </Button>
        </td>
      </>
    );
  };

  const redNumbers = Array.from({ length: 11 }, (_, i) => i + 2); // 2 to 12
  const yellowNumbers = Array.from({ length: 11 }, (_, i) => i + 2); // 2 to 12
  const greenNumbers = Array.from({ length: 11 }, (_, i) => 12 - i); // 12 to 2
  const blueNumbers = Array.from({ length: 11 }, (_, i) => 12 - i); // 12 to 2

  // Add at the top of QwixxScorecard component state:
  const [penaltyHold, setPenaltyHold] = useState(0); // 0 to 1
  const [isPenaltyHolding, setIsPenaltyHolding] = useState(false);
  const penaltyHoldRef = useRef<NodeJS.Timeout | null>(null);

  // Add these handlers inside QwixxScorecard:
  const startPenaltyHold = () => {
    if (penalties >= MAX_PENALTIES) return;
    setIsPenaltyHolding(true);
    const start = Date.now();
    setPenaltyHold(0);
    penaltyHoldRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      setPenaltyHold(Math.min(elapsed / 1000, 1));
      if (elapsed >= 1000) {
        clearInterval(penaltyHoldRef.current!);
        setPenaltyHold(1);
        setIsPenaltyHolding(false);
        handleAddPenalty();
        setTimeout(() => setPenaltyHold(0), 400); // animate fill out
      }
    }, 16);
  };
  const stopPenaltyHold = () => {
    setIsPenaltyHolding(false);
    setPenaltyHold(0);
    if (penaltyHoldRef.current) clearInterval(penaltyHoldRef.current);
  };

  // Prevent iOS text selection and focus during penalty hold
  const handleButtonInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (isPenaltyHolding) {
      e.preventDefault();
      e.stopPropagation();
      // Blur any focused element to prevent iOS focus ring
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  };

  // State for showing score breakdown in game over dialog
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Game Over Dialog
  const GameOverDialog = (
    <Dialog open={showGameOverDialog} onOpenChange={setShowGameOverDialog}>
      <DialogContent className=" max-h-[70vh] overflow-y-auto text-center flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
          className="flex flex-row items-center justify-center gap-2 mb-2"
        >
          <motion.span
            initial={{ y: 0 }}
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
          >
            <Trophy className="text-yellow-400 drop-shadow" size={28} />
          </motion.span>
        </motion.div>
        <DialogHeader>
          <DialogTitle className="text-base font-bold mb-1">
            Game Over!
          </DialogTitle>
          <DialogDescription className="mb-2 text-sm">
            Final Score:{" "}
            <span className="font-bold text-lg text-primary">
              {calculateTotalScore()}
            </span>
          </DialogDescription>
        </DialogHeader>
        {showBreakdown ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-3 top-3 z-10"
              onClick={() => setShowBreakdown(false)}
              aria-label="Back"
              onMouseDown={handleButtonInteraction}
              onTouchStart={handleButtonInteraction}
            >
              <ChevronLeft />
            </Button>
            <div className="w-full mt-2 mb-2fox: pt-2">
              <div className="scores-container flex items-center gap-2 mb-4 flex-wrap justify-center sm:justify-start">
                <Input
                  id="red-score-display"
                  className="w-12 text-center bg-red-200 border border-red-400 text-xs"
                  value={calculatePoints(red.length).toString()}
                  readOnly
                />
                <span>+</span>
                <Input
                  id="yellow-score-display"
                  className="w-12 text-center bg-yellow-200 border border-yellow-400 text-xs"
                  value={calculatePoints(yellow.length).toString()}
                  readOnly
                />
                <span>+</span>
                <Input
                  id="green-score-display"
                  className="w-12 text-center bg-green-200 border border-green-400 text-xs"
                  value={calculatePoints(green.length).toString()}
                  readOnly
                />
                <span>+</span>
                <Input
                  id="blue-score-display"
                  className="w-12 text-center bg-blue-200 border border-blue-400 text-xs"
                  value={calculatePoints(blue.length).toString()}
                  readOnly
                />
                <span>-</span>
                <Input
                  id="penalty-score-display"
                  className="w-12 text-center bg-muted border border-border text-xs"
                  value={Math.abs(penalties * 5).toString()}
                  readOnly
                />
                <span className="mt-2">=</span>
                <Input
                  id="total-score-display"
                  className="w-16 text-center font-bold border border-border bg-background text-foreground text-xs"
                  value={calculateTotalScore().toString()}
                  readOnly
                />
              </div>
              <div className="w-full max-w-3xl mx-auto">
                <div className="grid grid-cols-12 gap-1 mb-1">
                  {Array.from({ length: 12 }, (_, i) => (
                    <div
                      key={`tick-label-${i}`}
                      className="rounded-md bg-background text-foreground text-[10px] sm:text-xs font-semibold flex items-center justify-center border border-border py-1"
                    >
                      {i + 1}x
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-12 gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num, i) => (
                    <div
                      key={`tick-points-${i}`}
                      className="rounded-md bg-background text-foreground text-[10px] sm:text-xs flex items-center justify-center border border-border py-1"
                    >
                      {calculatePoints(num)}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-3 text-xs flex flex-col items-center gap-2">
                <span className="px-3 py-1 bg-muted rounded-full text-muted-foreground">
                  Each penalty (X): -5 points
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-row gap-2 mt-1 w-full">
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              onClick={() => {
                handleReset();
                setShowGameOverDialog(false);
              }}
              onMouseDown={handleButtonInteraction}
              onTouchStart={handleButtonInteraction}
            >
              <RotateCcw className="mr-2" size={16} /> Reset Game
            </Button>
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={() => setShowBreakdown(true)}
              onMouseDown={handleButtonInteraction}
              onTouchStart={handleButtonInteraction}
            >
              Show Score Breakdown
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  return (
    <motion.div
      className={`w-full flex flex-col items-center mx-auto text-lg sm:text-[22px] px-0 ${
        isPenaltyHolding ? "no-user-select penalty-holding" : ""
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      onMouseDown={handleButtonInteraction}
      onTouchStart={handleButtonInteraction}
    >
      {GameOverDialog}
      <div className="">
        <table className="min-w-[500px] border-separate border-spacing-y-2 sm:border-spacing-y-3 border-spacing-x-1 sm:border-spacing-x-2 mb-2">
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
      </div>

      {/* Main Action Buttons Row */}
      <motion.div
        className="mt-4 sm:mt-6 flex flex-row justify-center items-center space-x-1 sm:space-x-2"
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
                onMouseDown={handleButtonInteraction}
                onTouchStart={handleButtonInteraction}
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
                  onMouseDown={handleButtonInteraction}
                  onTouchStart={handleButtonInteraction}
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
                onMouseDown={handleButtonInteraction}
                onTouchStart={handleButtonInteraction}
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
                    onMouseDown={handleButtonInteraction}
                    onTouchStart={handleButtonInteraction}
                  >
                    <RotateCcw className="mr-2" />
                    Confirm Reset
                  </Button>
                  <DrawerClose asChild>
                    <Button
                      variant="outline"
                      className="transition duration-150 ease-in-out hover:scale-105 active:scale-95"
                      onMouseDown={handleButtonInteraction}
                      onTouchStart={handleButtonInteraction}
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
          className="relative transition duration-150 ease-in-out hover:scale-105 active:scale-95 overflow-hidden select-none"
          onMouseDown={(e) => {
            handleButtonInteraction(e);
            startPenaltyHold();
          }}
          onMouseUp={stopPenaltyHold}
          onMouseLeave={stopPenaltyHold}
          onTouchStart={(e) => {
            handleButtonInteraction(e);
            startPenaltyHold();
          }}
          onTouchEnd={stopPenaltyHold}
          disabled={penalties >= MAX_PENALTIES || isPenaltyHolding || gameOver}
          style={{ position: "relative" }}
        >
          {/* Progress overlay */}
          <motion.div
            className="absolute inset-0 z-10 bg-red-500/60 pointer-events-none"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{
              opacity: isPenaltyHolding || penaltyHold === 1 ? 1 : 0,
              scaleX: penaltyHold,
            }}
            style={{ originX: 0 }}
            transition={{ type: "tween", duration: 0.1 }}
          />
          <PlusCircle className="mr-2 relative z-20" />
          <span className="relative z-20">
            {penalties >= MAX_PENALTIES ? "Max Penalties" : "Add Penalty"}
          </span>
        </Button>

        {/* Show/Hide Scores Button (Right) */}
        <Button
          id="toggle-scores-button"
          variant="default"
          className="transition duration-150 ease-in-out hover:scale-105 active:scale-95"
          onClick={() => setIsScoreVisible(!isScoreVisible)}
          onMouseDown={handleButtonInteraction}
          onTouchStart={handleButtonInteraction}
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
        className="penalties-dots-container mt-4 sm:mt-6" // Renamed class for clarity, if needed
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
        className="mt-2 sm:mt-4"
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
        className="mt-4 sm:mt-8 p-2 sm:p-4 border border-border rounded-md bg-muted shadow-sm"
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
            {Array.from({ length: 12 }, (_, i) => (
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
        className="text-[0.7rem] sm:text-[0.8rem] text-muted-foreground mt-4 sm:mt-8 text-center"
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
