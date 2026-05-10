import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Expert {
  name: string;
  required: boolean;
}

interface PhaseGroup {
  label: string;
  experts: Expert[];
}

interface ExpertDropdownBlockProps {
  phaseGroup: PhaseGroup;
  phaseIndex: number;
  onSelectionChange?: (expertName: string, value: string) => void;
  selections?: Record<string, string>;
}

export const ExpertDropdownBlock = ({ phaseGroup, phaseIndex, onSelectionChange, selections = {} }: ExpertDropdownBlockProps) => {
  const [isOpen, setIsOpen] = useState(phaseIndex === 0);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/50 hover:bg-muted transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
            {phaseIndex + 1}
          </span>
          <span className="font-semibold text-sm">{phaseGroup.label}</span>
          <Badge variant="outline" className="text-[10px]">{phaseGroup.experts.length} experts</Badge>
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {isOpen && (
        <div className="divide-y divide-border">
          {phaseGroup.experts.map((expert) => (
            <div key={expert.name} className="flex items-center justify-between px-4 py-2.5 gap-3">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-sm truncate">{expert.name}</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] shrink-0 ${expert.required
                    ? 'border-red-500/30 text-red-600 dark:text-red-400'
                    : 'border-muted-foreground/30 text-muted-foreground'
                  }`}
                >
                  {expert.required ? 'Required' : 'Optional'}
                </Badge>
              </div>
              <Select
                value={selections[expert.name] || ''}
                onValueChange={(val) => onSelectionChange?.(expert.name, val)}
              >
                <SelectTrigger className="w-[180px] h-8 text-xs">
                  <SelectValue placeholder="Select preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flexirents_assigns">FlexiRents assigns</SelectItem>
                  <SelectItem value="i_have_one">I have one</SelectItem>
                  <SelectItem value="need_recommendation">Need recommendation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
