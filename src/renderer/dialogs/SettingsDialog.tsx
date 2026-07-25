import { GroupBox, Select } from 'react95';
import * as Themes from 'react95/dist/themes';
import { Theme } from 'react95/dist/types';
import Label from '../sdk/Label';
import { FlexWindowModal } from '../sdk/FlexWindowModal';
import { useCallback, useEffect, useState } from 'react';
import { GlobalReducer } from '../hooks/useGlobalState';
import { isNil } from 'lodash';

const ThemesArray = Object.entries(Themes.default);

type IProps = {
  global: GlobalReducer;
};

export const SettingsDialog = (props: IProps) => {
  const [state, dispatch] = props.global;

  const [themeMemory, setThemeMemory] = useState<Theme>();

  useEffect(() => {
    if (state.windowOpen.settings) {
      setThemeMemory(state.config.theme);
    } else {
      setThemeMemory(undefined);
    }
  }, [state.windowOpen.settings, setThemeMemory]);

  //Hydrate this dialog
  const hydrate = useCallback(async () => {
    const theme = await window.settings.get<string>('theme');
    const matchingTheme = ThemesArray.find(([itm]) => itm === theme);
    !isNil(theme) && !isNil(matchingTheme) && !isNil(matchingTheme[1]);
    theme !== 'system' &&
      dispatch({
        config: { theme: matchingTheme![1] },
      });
  }, []);
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <FlexWindowModal
      title="Settings"
      isOpen={state.windowOpen.settings}
      onClose={() => dispatch({ windowOpen: { settings: false } })}
      height={600}
      width={500}
      bottomButtons={[
        {
          text: 'save',
          onPress: () => {
            window.settings.set('theme', state.config.theme.name);
          },
          closesWindow: true,
        },
        {
          text: 'cancel',
          onPress: () => {
            dispatch({ config: { theme: themeMemory } });
          },
          closesWindow: true,
        },
      ]}
    >
      <GroupBox
        label="visual"
        style={{ marginTop: '1rem', marginLeft: '1rem', marginRight: '1rem' }}
      >
        <Label>Theme:</Label>
        <Select
          defaultValue={ThemesArray.map((t) => t[0]).indexOf(
            state.config.theme.name,
          )}
          options={ThemesArray.map((v: [string, Theme], i) => {
            return { value: i, label: v[0] };
          })}
          menuMaxHeight={160}
          width={160}
          onChange={(e) => {
            dispatch({ config: { theme: ThemesArray[e.value][1] } });
          }}
        />
      </GroupBox>
    </FlexWindowModal>
  );
};
