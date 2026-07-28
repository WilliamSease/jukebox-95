import { isEmpty } from 'lodash';
import styled, { css } from 'styled-components';

export const AlternateGrey = styled.div<{
  index: number;
  isSelected: boolean;
  solidTextBackground: boolean;
}>`
  ${({ index, isSelected, solidTextBackground, theme }) => css`
    background: ${
      isSelected && !solidTextBackground
        ? theme.borderDark
        : index % 2 === 0
          ? theme.borderLight
          : 'unset'
    };
    color: ${isSelected ? theme.materialTextInvert : theme.materialText};
    margin-top: 0.2rem;
  `}
`;

export const ProgrammaticallyBackgroundableSpan = styled.span<{
  isSelected: boolean;
  solidTextBackground: boolean;
  solidTextBackgroundOverride: string;
}>`
  ${({
    isSelected,
    solidTextBackground,
    solidTextBackgroundOverride,
    theme,
  }) => css`
    background: ${!solidTextBackground ? 'unset' : !isEmpty(solidTextBackgroundOverride) ? solidTextBackgroundOverride : isSelected ? theme.materialText : theme.materialTextInvert};
  `}
`;
