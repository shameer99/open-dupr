import React from "react";
import { Button } from "@/components/ui/button";
import Modal from "@/components/ui/modal";

interface ConfidenceModalProps {
  open: boolean;
  onClose: () => void;
}

const ConfidenceModal: React.FC<ConfidenceModalProps> = ({ open, onClose }) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel="Confidence Percentage Explanation"
      className="max-w-sm"
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Confidence %</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            ×
          </Button>
        </div>

        <div className="space-y-3 text-sm">
          <p>
            <strong>Confidence %</strong> measures how accurately your DUPR
            rating reflects your current skill level (1-100%).
          </p>

          <div>
            <p className="font-medium mb-2">Key Factors:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>
                <strong>Match Frequency:</strong> Regular play increases
                confidence
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
              Learn more →
            </a>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ConfidenceModal;
