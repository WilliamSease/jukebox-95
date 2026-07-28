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
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  GlobalReducer,
  CachedVisualSettingsType,
  VisualSettingsType,
  BehaviorSettingsType,
  visualSettingsDefault,
  behaviorSettingsDefault,
} from '../hooks/useGlobalState';
import { isEmpty, isNil } from 'lodash';
import { exampleThemes } from '../static/settingsExamples/index';

const ThemesArray = Object.entries(Themes.default);

type IProps = {
  global: GlobalReducer;
};

export const SettingsDialog = (props: IProps) => {
  const [state, dispatch] = props.global;

  const [memory, setMemory] = useState({
    visualSettings: state.visualSettings,
    behaviorSettings: state.behaviorSettings,
  });
  const [showManage, setShowManage] = useState(false);
  const [cachedSettingsName, setCachedSettingsName] = useState('');

  const imgUploadRef = useRef<HTMLInputElement | null>(null);
  const jsonUploadRef = useRef<HTMLInputElement | null>(null);

  const [showTheme, setShowTheme] = useState<boolean>(false);

  useEffect(() => {
    if (state.windowOpen.settings) {
      setMemory({
        visualSettings: state.visualSettings,
        behaviorSettings: state.behaviorSettings,
      });
    }
  }, [state.windowOpen.settings]);

  //Hydrate this dialog
  const hydrate = useCallback(async () => {
    try {
      const visualSettings =
        await window.settings.get<VisualSettingsType>('visualSettings');
      const userCachedSettings =
        await window.settings.get<CachedVisualSettingsType>(
          'userCachedSettings',
        );
      const behaviorSettings =
        await window.settings.get<BehaviorSettingsType>('behaviorSettings');

      dispatch({
        visualSettings: visualSettings ?? visualSettingsDefault,
        userCachedSettings: userCachedSettings ?? [],
        behaviorSettings: behaviorSettings ?? behaviorSettingsDefault,
      });
    } catch (err) {
      dispatch({ ui: { errorMessage: err as unknown as string } });
    }
  }, []);
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <FlexWindowModal
      title={showManage ? 'Manage visual settings' : 'Settings'}
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
                        JSON.stringify(state.visualSettings, null, 2),
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
                {
                  text: 'discard',
                  onPress: () => {
                    dispatch({
                      visualSettings: memory.visualSettings,
                      behaviorSettings: memory.behaviorSettings,
                    });
                  },
                  closesWindow: true,
                },
                {
                  text: 'apply',
                  onPress: async () => {
                    await window.settings.set(
                      'visualSettings',
                      state.visualSettings,
                    );
                    await window.settings.set(
                      'behaviorSettings',
                      state.behaviorSettings,
                    );
                  },
                  closesWindow: true,
                },
              ]
      }
    >
      {showTheme ? (
        <div style={{ userSelect: 'text', margin: '.5rem' }}>
          <Label children={'Theme info:'} />
          <ScrollView style={{ height: 400, backgroundColor: 'white' }}>
            {Object.entries(state.visualSettings.theme).map((val) => (
              <div>
                {
                  <span style={{ fontWeight: 'bold', marginRight: '.25rem' }}>
                    {val[0]}
                    {':'}
                  </span>
                }
                {`${val[1]} `}
                <span
                  style={{
                    border: 'solid black 1px',
                    backgroundColor: val[1],
                    color: val[1],
                    paddingRight: '4rem',
                    marginLeft: '.25rem',
                  }}
                ></span>
              </div>
            ))}
          </ScrollView>
        </div>
      ) : showManage ? (
        <div style={{ padding: '.5rem' }}>
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
                let text: VisualSettingsType = await JSON.parse(
                  await selectedFile.text(),
                );
                console.info(text);
                dispatch({ visualSettings: text });
              } catch {
                dispatch({
                  ui: { errorMessage: 'ambiguous catch in upload function!' },
                });
              } finally {
                target.value = '';
              }
            }}
          />
          <Label>System examples:</Label>
          <div>
            {Object.entries(exampleThemes).map(([key, settings]) => {
              return (
                <Button
                  children={key}
                  onClick={() =>
                    dispatch({ visualSettings: settings as VisualSettingsType })
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
                      .concat([[cachedSettingsName, state.visualSettings]]); // careful -- that's a tuple
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
                    onClick={() => dispatch({ visualSettings: settings })}
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
                  state.visualSettings.theme.name,
                )}
                options={ThemesArray.map((v: [string, Theme], i) => {
                  return { value: i, label: v[0] };
                })}
                value={ThemesArray.findIndex(
                  ([name]) => name === state.visualSettings.theme.name,
                )}
                menuMaxHeight={160}
                width={160}
                onChange={(e) => {
                  dispatch({
                    visualSettings: { theme: ThemesArray[e.value][1] },
                  });
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
                checked={state.visualSettings.showBackgroundImage}
                onClick={() =>
                  dispatch({
                    visualSettings: {
                      showBackgroundImage:
                        !state.visualSettings.showBackgroundImage,
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
                value={state.visualSettings.backgroundSizeStrategy}
                onChange={(option) =>
                  dispatch({
                    visualSettings: { backgroundSizeStrategy: option.value },
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
                  dispatch({ visualSettings: { backgroundImageBase64: '' } });
                }}
              />
            </div>
            <Label>Background additional css: </Label>
            <TextInput
              value={state.visualSettings.backgroundCustomCSS}
              placeholder="    background-position: right; etc..."
              onChange={(event) =>
                dispatch({
                  visualSettings: { backgroundCustomCSS: event.target.value },
                })
              }
              multiline
            />
            <Label>Background all text:</Label>
            <Checkbox
              checked={state.visualSettings.solidTextBackground}
              onClick={() =>
                dispatch({
                  visualSettings: {
                    solidTextBackground:
                      !state.visualSettings.solidTextBackground,
                  },
                })
              }
            />
            <Select
              value={state.visualSettings.solidTextBackgroundOverride}
              options={[{ value: '', label: '(default)' }].concat(
                Object.entries(state.visualSettings.theme).map(
                  ([theme, val]) => ({
                    value: val,
                    label: theme,
                  }),
                ),
              )}
              menuMaxHeight={'8rem'}
              onChange={(event) => {
                console.info(event);
                dispatch({
                  visualSettings: {
                    solidTextBackgroundOverride: event.value,
                  },
                });
              }}
              width={'10rem'}
              style={{ width: '10rem' }}
            />
            <div>
              <Button
                children={'Manage saved visual settings...'}
                onClick={() => setShowManage(true)}
              />
            </div>
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
                      visualSettings: {
                        backgroundImageBase64: fileReader.result,
                      },
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
          <GroupBox
            label="behavior"
            style={{
              marginTop: '1rem',
              marginLeft: '1rem',
              marginRight: '1rem',
            }}
          >
            <Checkbox
              checked={state.behaviorSettings.randomizeTree}
              label={'Randomize tree at one below root'}
              onClick={() => {
                dispatch({
                  behaviorSettings: {
                    randomizeTree: !state.behaviorSettings.randomizeTree,
                  },
                });
              }}
            />
          </GroupBox>
        </>
      )}
    </FlexWindowModal>
  );
};
