import { IconChevronDown } from '@/ui/display/icon';
import { DropdownMenuHeader } from '@/ui/layout/dropdown/components/DropdownMenuHeader';
import { useFilterDropdown } from '@/ui/object/object-filter-dropdown/hooks/useFilterDropdown';

import { getOperandLabel } from '../utils/getOperandLabel';

type ObjectFilterDropdownOperandButtonProps = {
  filterDropdownId?: string;
};

export const ObjectFilterDropdownOperandButton = ({
  filterDropdownId,
}: ObjectFilterDropdownOperandButtonProps) => {
  const {
    selectedOperandInDropdown,
    setIsObjectFilterDropdownOperandSelectUnfolded,
    isObjectFilterDropdownOperandSelectUnfolded,
  } = useFilterDropdown({ filterDropdownId });

  if (isObjectFilterDropdownOperandSelectUnfolded) {
    return null;
  }

  return (
    <DropdownMenuHeader
      key={'selected-filter-operand'}
      EndIcon={IconChevronDown}
      onClick={() => setIsObjectFilterDropdownOperandSelectUnfolded(true)}
    >
      {getOperandLabel(selectedOperandInDropdown)}
    </DropdownMenuHeader>
  );
};
