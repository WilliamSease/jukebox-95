import {
  Button,
  Checkbox,
  GroupBox,
  ScrollView,
  Select,
  TextInput,
} from 'react95';
import * as Themes from 'react95/dist/themes';
import { Theme } from 'react95/dist/types';
import Label from '../sdk/Label';
import { FlexWindowModal } from '../sdk/FlexWindowModal';
import { Ref, useCallback, useEffect, useRef, useState } from 'react';
import {
  SettingsType,
  GlobalReducer,
  CachedSettingsType,
} from '../hooks/useGlobalState';
import { isEmpty, isNil } from 'lodash';
import { exampleThemes } from '../static/settingsExamples/index';
import { text } from 'stream/consumers';

const ThemesArray = Object.entries(Themes.default);

type IProps = {
  global: GlobalReducer;
};

export const SettingsDialog = (props: IProps) => {
  const [state, dispatch] = props.global;

  const [memory, setMemory] = useState(state.settings);
  const [showManage, setShowManage] = useState(false);
  const [cachedSettingsName, setCachedSettingsName] = useState('');

  const imgUploadRef = useRef<HTMLInputElement | null>(null);
  const jsonUploadRef = useRef<HTMLInputElement | null>(null);

  const [showTheme, setShowTheme] = useState<boolean>(false);

  useEffect(() => {
    if (state.windowOpen.settings) {
      setMemory(state.settings);
    }
  }, [state.windowOpen.settings]);

  //Hydrate this dialog
  const hydrate = useCallback(async () => {
    try {
      const settings = await window.settings.get<SettingsType>('settings');
      const userCachedSettings =
        await window.settings.get<CachedSettingsType>('userCachedSettings');

      console.info(settings);
      console.info(userCachedSettings);
      if (!isNil(settings)) {
        dispatch({
          settings: settings,
          userCachedSettings: userCachedSettings ?? [],
        });
      }
    } catch (err) {
      dispatch({ ui: { errorMessage: err as unknown as string } });
    }
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
      bottomButtons={
        showTheme
          ? [{ text: '<- back', onPress: () => setShowTheme(false) }]
          : showManage
            ? [
                {
                  text: 'export...',
                  onPress: () => {
                    const dataStr =
                      'data:text/json;charset=utf-8,' +
                      encodeURIComponent(
                        JSON.stringify(state.settings, null, 2),
                      );

                    // 2. Create a temporary anchor element
                    const downloadAnchorElem = document.createElement('a');

                    // 3. Set the href to the JSON data string and specify the filename
                    downloadAnchorElem.setAttribute('href', dataStr);
                    downloadAnchorElem.setAttribute(
                      'download',
                      `settings.json`,
                    );

                    // 4. Programmatically click the element to trigger the download
                    downloadAnchorElem.click();

                    // 5. Remove the element from memory
                    downloadAnchorElem.remove();
                  },
                },
                {
                  text: 'import...',
                  onPress: () => {
                    jsonUploadRef.current?.click();
                  },
                },
                { text: '<- back', onPress: () => setShowManage(false) },
              ]
            : [
                { text: 'manage...', onPress: () => setShowManage(true) },

                {
                  text: 'discard',
                  onPress: () => {
                    dispatch({
                      settings: memory,
                    });
                  },
                  closesWindow: true,
                },
                {
                  text: 'apply',
                  onPress: () => {
                    window.settings.set('settings', state.settings);
                  },
                  closesWindow: true,
                },
              ]
      }
    >
      {showTheme ? (
        <div style={{ userSelect: 'text', margin: '.5rem' }}>
          <Label children={'Theme info:'} />
          <ScrollView style={{ height: 400 }}>
            {Object.entries(state.settings.theme).map((val) => (
              <div>
                {
                  <span style={{ fontWeight: 'bold', marginRight: '.25rem' }}>
                    {val[0]}
                    {':'}
                  </span>
                }
                {`${val[1]}`}
              </div>
            ))}
          </ScrollView>
        </div>
      ) : showManage ? (
        <div style={{ padding: '.5rem' }}>
          <Label>System examples:</Label>
          <div>
            {Object.entries(exampleThemes).map(([key, settings]) => {
              return (
                <Button
                  children={key}
                  onClick={() =>
                    dispatch({ settings: settings as SettingsType })
                  }
                />
              );
            })}
          </div>
          <Label style={{ paddingTop: '.5rem' }}>
            User cached settings (preserved):
          </Label>
          <div>
            <TextInput
              value={cachedSettingsName}
              onChange={(event) => setCachedSettingsName(event.target.value)}
              placeholder="cached settings name (required)"
            />
            <Button
              onClick={() => {
                try {
                  if (!isEmpty(cachedSettingsName)) {
                    console.info('Writing these settings to cache...');
                    const newUserCachedSettings = state.userCachedSettings
                      .filter(([name]) => name !== cachedSettingsName)
                      .concat([[cachedSettingsName, state.settings]]); // careful -- that's a tuple
                    console.info(newUserCachedSettings);
                    dispatch({
                      userCachedSettings: newUserCachedSettings,
                    });
                    window.settings.set(
                      'userCachedSettings',
                      newUserCachedSettings,
                    );
                  }
                } catch (err) {
                  dispatch({ ui: { errorMessage: err as unknown as string } });
                }
              }}
            >
              Cache...
            </Button>
            <Button
              style={{ marginLeft: '.5rem' }}
              onClick={() => {
                try {
                  dispatch({
                    userCachedSettings: [],
                  });
                  window.settings.set('userCachedSettings', []);
                } catch (err) {
                  dispatch({ ui: { errorMessage: err as unknown as string } });
                }
              }}
            >
              Wipe Cache(!)...
            </Button>
          </div>
          <div style={{ marginTop: '.5rem' }}>
            {state.userCachedSettings.map(([key, settings]) => {
              return (
                <span style={{ whiteSpace: 'nowrap' }}>
                  <Button
                    children={key}
                    onClick={() => dispatch({ settings: settings })}
                  />
                  <Button
                    style={{ marginRight: '.5rem' }}
                    children="🗑️"
                    onClick={() => {
                      try {
                        console.info(`wiping ${key} from cache...`);
                        const newUserCachedSettings =
                          state.userCachedSettings.filter(
                            ([name]) => name !== key,
                          );
                        console.info(newUserCachedSettings);
                        dispatch({
                          userCachedSettings: newUserCachedSettings,
                        });
                        window.settings.set(
                          'userCachedSettings',
                          newUserCachedSettings,
                        );
                      } catch (err) {
                        dispatch({
                          ui: { errorMessage: err as unknown as string },
                        });
                      }
                    }}
                  />
                </span>
              );
            })}
          </div>
        </div>
      ) : (
        <>
          <GroupBox
            label="visual"
            style={{
              marginTop: '1rem',
              marginLeft: '1rem',
              marginRight: '1rem',
            }}
          >
            <div>
              <Label>Theme:</Label>
              <Select
                defaultValue={ThemesArray.map((t) => t[0]).indexOf(
                  state.settings.theme.name,
                )}
                options={ThemesArray.map((v: [string, Theme], i) => {
                  return { value: i, label: v[0] };
                })}
                value={ThemesArray.findIndex(
                  ([name]) => name === state.settings.theme.name,
                )}
                menuMaxHeight={160}
                width={160}
                onChange={(e) => {
                  dispatch({ settings: { theme: ThemesArray[e.value][1] } });
                }}
              />
              <Button
                style={{ marginLeft: '.5rem' }}
                children={'info'}
                onClick={() => setShowTheme(true)}
              />
            </div>
            <div>
              <div style={{ marginTop: '.25rem' }}>
                <Label>Background:</Label>
              </div>
              <Checkbox
                checked={state.settings.showBackgroundImage}
                onClick={() =>
                  dispatch({
                    settings: {
                      showBackgroundImage: !state.settings.showBackgroundImage,
                    },
                  })
                }
              />
              show
              <Select
                style={{ marginLeft: '.5rem' }}
                options={[
                  {
                    value: 'auto',
                    label: 'auto',
                  },
                  {
                    value: 'contain',
                    label: 'contain',
                  },
                  {
                    value: 'cover',
                    label: 'cover',
                  },
                ]}
                value={state.settings.backgroundSizeStrategy}
                onChange={(option) =>
                  dispatch({
                    settings: { backgroundSizeStrategy: option.value },
                  })
                }
              />
              <Button
                style={{ marginLeft: '.5rem' }}
                children={'upload'}
                onClick={() => imgUploadRef.current?.click()}
              />
              <Button
                children={'remove'}
                onClick={() => {
                  dispatch({ settings: { backgroundImageBase64: '' } });
                }}
              />
            </div>
            <Label>Background additional css: </Label>
            <TextInput
              value={state.settings.backgroundCustomCSS}
              placeholder="    background-position: right; etc..."
              onChange={(event) =>
                dispatch({
                  settings: { backgroundCustomCSS: event.target.value },
                })
              }
              multiline
            />
            <Label>Background all text:</Label>
            <Checkbox
              checked={state.settings.solidTextBackground}
              onClick={() =>
                dispatch({
                  settings: {
                    solidTextBackground: !state.settings.solidTextBackground,
                  },
                })
              }
            />
            <Select
              value={state.settings.solidTextBackgroundOverride}
              options={[{ value: '', label: '(default)' }].concat(
                Object.entries(state.settings.theme).map(([theme, val]) => ({
                  value: val,
                  label: theme,
                })),
              )}
              menuMaxHeight={'8rem'}
              onChange={(event) => {
                console.info(event);
                dispatch({
                  settings: {
                    solidTextBackgroundOverride: event.value,
                  },
                });
              }}
              width={'10rem'}
              style={{ width: '10rem' }}
            />
          </GroupBox>
          <input
            style={{ display: 'none' }}
            type="file"
            id="imageUpload"
            accept="image/*"
            ref={imgUploadRef}
            onInput={async (event): Promise<void> => {
              const target = event.currentTarget;
              if (!target.files || target.files.length === 0) {
                dispatch({ ui: { errorMessage: 'No file!' } });
                return;
              }

              const selectedFile = target.files[0];

              try {
                const fileReader = new FileReader();
                fileReader.readAsDataURL(selectedFile);
                fileReader.onload = () => {
                  if (typeof fileReader.result === 'string') {
                    dispatch({
                      settings: { backgroundImageBase64: fileReader.result },
                    });
                  } else {
                    dispatch({
                      ui: { errorMessage: 'base64 result was not string!' },
                    });
                  }
                };
              } catch {
                dispatch({
                  ui: { errorMessage: 'ambiguous catch in upload function!' },
                });
              }
            }}
          />
          <input
            style={{ display: 'none' }}
            type="file"
            id="fileUpload"
            accept="*.json"
            ref={jsonUploadRef}
            onInput={async (event): Promise<void> => {
              console.info('input detected');
              const target = event.currentTarget;
              if (!target.files || target.files.length === 0) {
                dispatch({ ui: { errorMessage: 'No file!' } });
                return;
              }

              const selectedFile = target.files[0];

              try {
                let text: SettingsType = await JSON.parse(
                  await selectedFile.text(),
                );
                console.info(text);
                dispatch({ settings: text });
              } catch {
                dispatch({
                  ui: { errorMessage: 'ambiguous catch in upload function!' },
                });
              } finally {
                target.value = '';
              }
            }}
          />
        </>
      )}
    </FlexWindowModal>
  );
};
