import React from "react";
import { Button } from "@/components/ui/button";
import Modal from "@/components/ui/modal";

interface ReliabilityModalProps {
  open: boolean;
  onClose: () => void;
  reliabilityPercentage?: number;
}

const ReliabilityModal: React.FC<ReliabilityModalProps> = ({
  open,
  onClose,
  reliabilityPercentage,
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel="Reliability Percentage Explanation"
      className="max-w-sm"
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            Reliability Score{" "}
            {reliabilityPercentage !== undefined && `(${reliabilityPercentage}%)`}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            ×
          </Button>
        </div>

        {/* Progress Bar */}
        {reliabilityPercentage !== undefined && (
          <div className="mb-4">
            <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(reliabilityPercentage, 100)}%` }}
              />
              {/* 60% Threshold Indicator */}
              <div
                className="absolute top-0 h-full w-0.5 bg-white border-x border-gray-300"
                style={{ left: "60%" }}
              />
            </div>
            <div className="relative text-xs text-gray-500 mt-2">
              {/* 0% and 100% labels */}
              <div className="flex justify-between">
                <span>0%</span>
                <span>100%</span>
              </div>
              {/* 60% and "reliable" labels aligned with threshold */}
              <div className="absolute top-0 w-full">
                <div
                  className="flex flex-col items-center absolute"
                  style={{ left: "60%", transform: "translateX(-50%)" }}
                >
                  <span className="font-medium">60%</span>
                  <span className="font-medium text-xs mt-0.5">reliable</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3 text-sm">
          <p>
            The DUPR <strong>Reliability Score</strong> measures how accurately
            your DUPR rating reflects your current skill level (1-100%).
          </p>

          <div>
            <p className="font-medium mb-2">Key Factors:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>
                <strong>Match Frequency:</strong> Regular play increases
                reliability
              </li>
              <li>
                <strong>Match Recency:</strong> Recent matches matter more
              </li>
              <li>
                <strong>Opponent Diversity:</strong> Playing varied opponents
                helps
              </li>
            </ul>
          </div>

          <p className="text-xs text-muted-foreground">
            Scores ≥60% are considered reliable. Keep playing and logging
            matches to improve!
          </p>

          <div className="pt-3 border-t">
            <a
              href="https://www.dupr.com/post/introducing-the-dupr-reliability-score"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm underline"
            >
              Learn more on DUPR's blog →
            </a>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ReliabilityModal;
