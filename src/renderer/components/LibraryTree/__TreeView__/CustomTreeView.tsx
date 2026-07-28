import React, { forwardRef, useCallback } from 'react';
import styled, { css } from 'styled-components';

import useControlledOrUncontrolled from 'react95/dist/common/hooks/useControlledOrUncontrolled';
import { LabelText, StyledLabel } from 'react95/dist/common/SwitchBase';
import { CommonStyledProps } from 'react95/dist/types';

type TreeLeaf<T> = {
  disabled?: boolean;
  icon?: React.ReactNode;
  id: T;
  items?: TreeLeaf<T>[];
  label?: string;
};

type TreeViewProps<T> = {
  className?: string;
  defaultExpanded?: T[];
  defaultSelected?: T;
  disabled?: boolean;
  expanded?: T[];
  onNodeSelect?: (event: React.MouseEvent<HTMLElement>, id: T) => void;
  onNodeToggle?: (
    event: React.MouseEvent<HTMLElement>,
    expandedIds: T[],
  ) => void;
  selected?: T;
  getKey: (toGetKey: T) => string;
  style?: React.CSSProperties;
  tree: TreeLeaf<T>[];
} & CommonStyledProps;

type TreeBranchProps<T> = {
  className: string | undefined;
  disabled: boolean;
  expanded: T[];
  innerRef?: React.Ref<HTMLUListElement>;
  level: number;
  onSelect: (event: React.MouseEvent<HTMLElement>, id: T) => void;
  onToggle: (event: React.MouseEvent<HTMLElement>, id: T) => void;
  selected: T | undefined;
  getKey: (toGetKey: T) => string;
  style: React.CSSProperties | undefined;
  tree: TreeLeaf<T>[];
} & CommonStyledProps;

const Text = styled(LabelText)`
  white-space: nowrap;
`;

const focusedElementStyles = css<{ $disabled: boolean }>`
  :focus {
    outline: none;
  }

  ${({ $disabled }) =>
    !$disabled
      ? css`
          cursor: pointer;

          :focus {
            ${Text} {
              background: ${({ theme }) => theme.hoverBackground};
              color: ${({ theme }) => theme.materialTextInvert};
              outline: 2px dotted ${({ theme }) => theme.focusSecondary};
            }
          }
        `
      : `cursor: default;`}
`;

const TreeWrapper = styled.ul<{ isRootLevel: boolean }>`
  position: relative;
  isolation: isolate;

  ${({ isRootLevel }) =>
    isRootLevel &&
    css`
      &:before {
        content: '';
        position: absolute;
        top: 20px;
        bottom: 0;
        left: 5.5px;
        width: 1px;
        border-left: 2px dashed ${({ theme }) => theme.borderDark};
      }
    `}

  ul {
    padding-left: 19.5px;
  }

  li {
    position: relative;

    &:before {
      content: '';
      position: absolute;
      top: 17.5px;
      left: 5.5px;
      width: 22px;
      border-top: 2px dashed ${({ theme }) => theme.borderDark};
      font-size: 12px;
    }
  }
`;

const TreeItem = styled.li<{ hasItems: boolean; isRootLevel: boolean }>`
  position: relative;
  padding-left: ${({ hasItems }) => (!hasItems ? '13px' : '0')};

  ${({ isRootLevel }) =>
    !isRootLevel
      ? css`
          &:last-child {
            &:after {
              content: '';
              position: absolute;
              z-index: 1;
              top: 19.5px;
              bottom: 0;
              left: 1.5px;
              width: 10px;
              background: ${({ theme }) => theme.material};
            }
          }
        `
      : css`
          &:last-child {
            &:after {
              content: '';
              position: absolute;
              top: 19.5px;
              left: 1px;
              bottom: 0;
              width: 10px;
              background: ${({ theme }) => theme.material};
            }
          }
        `}

  /* the nested <ul> of children needs to sit above the dashed
     connector line drawn by the rules above */
  & > ul {
    position: relative;
    z-index: 2;

    &:after {
      content: '';
      position: absolute;
      top: -18px;
      bottom: 0;
      left: 25px;
      border-left: 2px dashed ${({ theme }) => theme.borderDark};
    }
  }
`;

const Row = styled.div<{ $hasItems: boolean }>`
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  /* leave room for the expand/collapse box when this node has children */
  padding-left: ${({ $hasItems }) => ($hasItems ? '18px' : '0')};
`;

const ExpandToggle = styled.button`
  all: unset;
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  box-sizing: border-box;
  display: block;
  width: 8px;
  height: 9px;
  border: 2px solid #808080;
  padding-left: 1px;
  background-color: #fff;
  line-height: 8px;
  font-size: 10px;
  text-align: center;
  cursor: pointer;

  &:disabled {
    cursor: default;
  }

  &:focus-visible {
    outline: 2px dotted ${({ theme }) => theme.focusSecondary};
  }
`;

const TitleWithIcon = styled(StyledLabel)`
  position: relative;
  z-index: 1;
  background: none;
  border: 0;
  font-family: inherit;
  padding-top: 8px;
  padding-bottom: 8px;
  margin: 0;
  ${focusedElementStyles};
`;

const Icon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-right: 6px;
`;

function toggleItem<T>(state: T[], id: T) {
  return state.includes(id)
    ? state.filter((item) => item !== id)
    : [...state, id];
}

function TreeBranch<T>({
  className,
  disabled,
  expanded,
  innerRef,
  level,
  onSelect,
  onToggle,
  selected,
  style,
  getKey,
  tree = [],
}: TreeBranchProps<T>) {
  const isRootLevel = level === 0;

  return (
    <TreeWrapper
      className={isRootLevel ? className : undefined}
      style={isRootLevel ? style : undefined}
      ref={isRootLevel ? innerRef : undefined}
      role={isRootLevel ? 'tree' : 'group'}
      isRootLevel={isRootLevel}
    >
      {tree.map((item) => {
        const hasItems = Boolean(item.items && item.items.length > 0);
        const isExpanded = expanded.includes(item.id);
        const isSelected = selected === item.id;
        const isNodeDisabled = (disabled || item.disabled) ?? false;

        // Two independent actions, two independent handlers.
        // Clicking the box toggles expansion and nothing else.
        const handleToggleClick = (event: React.MouseEvent<HTMLElement>) => {
          event.stopPropagation();
          if (!isNodeDisabled) onToggle(event, item.id);
        };

        // Clicking the label/icon selects and nothing else.
        const handleSelectClick = (event: React.MouseEvent<HTMLElement>) => {
          if (!isNodeDisabled) onSelect(event, item.id);
        };

        return (
          <TreeItem
            key={getKey(item.id)}
            isRootLevel={isRootLevel}
            role="treeitem"
            aria-expanded={hasItems ? isExpanded : undefined}
            aria-selected={isSelected}
            hasItems={hasItems}
          >
            <Row $hasItems={hasItems}>
              {hasItems && (
                <ExpandToggle
                  type="button"
                  tabIndex={isNodeDisabled ? -1 : 0}
                  disabled={isNodeDisabled}
                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                  onClick={handleToggleClick}
                >
                  {isExpanded ? '-' : '+'}
                </ExpandToggle>
              )}

              <TitleWithIcon
                as="button"
                type="button"
                $disabled={isNodeDisabled}
                onClick={handleSelectClick}
              >
                <Icon aria-hidden>{item.icon}</Icon>
                <Text>{item.label}</Text>
              </TitleWithIcon>
            </Row>

            {hasItems && isExpanded && (
              <TreeBranch
                className={className}
                disabled={isNodeDisabled}
                expanded={expanded}
                level={level + 1}
                onSelect={onSelect}
                onToggle={onToggle}
                selected={selected}
                getKey={getKey}
                style={style}
                tree={item.items ?? []}
              />
            )}
          </TreeItem>
        );
      })}
    </TreeWrapper>
  );
}

function TreeInner<T>(
  {
    className,
    defaultExpanded = [],
    defaultSelected,
    disabled = false,
    expanded,
    onNodeSelect,
    onNodeToggle,
    getKey,
    selected,
    style,
    tree = [],
  }: TreeViewProps<T>,
  ref: React.ForwardedRef<HTMLUListElement>,
) {
  const [expandedInternal, setExpandedInternal] = useControlledOrUncontrolled({
    defaultValue: defaultExpanded,
    onChange: onNodeToggle,
    onChangePropName: 'onNodeToggle',
    value: expanded,
    valuePropName: 'expanded',
  });

  const [selectedInternal, setSelectedInternal] = useControlledOrUncontrolled({
    defaultValue: defaultSelected,
    onChange: onNodeSelect,
    onChangePropName: 'onNodeSelect',
    value: selected,
    valuePropName: 'selected',
  });

  const handleToggle = useCallback(
    (event: React.MouseEvent<HTMLElement>, id: T) => {
      const newState = toggleItem(expandedInternal, id);

      setExpandedInternal(newState);

      if (onNodeToggle) {
        onNodeToggle(event, newState);
      }
    },
    [expandedInternal, onNodeToggle, setExpandedInternal],
  );

  const handleSelect = useCallback(
    (event: React.MouseEvent<HTMLElement>, id: T) => {
      setSelectedInternal(id);

      if (onNodeSelect) {
        onNodeSelect(event, id);
      }
    },
    [onNodeSelect, setSelectedInternal],
  );

  return (
    <TreeBranch
      className={className}
      disabled={disabled}
      expanded={expandedInternal}
      level={0}
      innerRef={ref}
      onSelect={handleSelect}
      onToggle={handleToggle}
      getKey={getKey}
      selected={selectedInternal}
      style={style}
      tree={tree}
    />
  );
}

const TreeView = forwardRef(TreeInner) as <T>(
  props: TreeViewProps<T> & { ref?: React.ForwardedRef<HTMLUListElement> },
) => ReturnType<typeof TreeInner<T>>;

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
TreeView.displayName = 'TreeView';

export { TreeView, TreeViewProps, TreeLeaf };
