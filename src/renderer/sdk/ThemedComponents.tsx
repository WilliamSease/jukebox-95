import styled, { css } from 'styled-components';

export const AlternateGrey = styled.div<{
  index: number;
  isSelected?: boolean;
}>`
  ${({ index, isSelected, theme }) => css`
    background: ${isSelected ? 'unset' : index % 2 === 0 ? 'unset' : 'unset'};
    color: ${isSelected ? 'unset' : 'unset'};
    margin-top: 0.2rem;
  `}
`;
