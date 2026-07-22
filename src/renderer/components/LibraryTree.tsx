import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Button,
  Frame,
  Hourglass,
  ScrollView,
  Tab,
  Tabs,
  TreeView,
} from 'react95';

import './LibraryTree.css';

export const LibraryTree = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const nodes = useMemo(() => {
    switch (activeTab) {
      case 0:
        return [];
    }
  }, [activeTab]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <Tabs
          style={{ marginTop: 6, width: '80%' }}
          value={activeTab}
          onChange={setActiveTab}
        >
          <Tab value={0}>Folders</Tab>

          <span style={{ flexGrow: 1 }}></span>
        </Tabs>
        <Button variant="thin" style={{ width: '20%' }} onClick={() => {}}>
          Refresh
        </Button>
      </div>
      <div style={{ flexGrow: 1, display: 'flex' }}>
        <Frame variant="field" style={{ display: 'flex', flexGrow: 1 }}>
          <ScrollView
            style={{
              height: '100%',
              width: '100%',
              position: 'absolute',
              display: 'flex',
            }}
          >
            {loading ? (
              <div
                style={{
                  position: 'relative',
                  top: '50%',
                  left: '48%',
                  width: '50%',
                }}
              >
                <Hourglass size={16} />
              </div>
            ) : (
              <TreeView
                tree={nodes ?? []}
                onNodeSelect={(_e, id) => {
                  switch (activeTab) {
                    case 0:
                      //do something useful

                      break;
                  }
                }}
                onNodeToggle={() => {}}
              />
            )}
          </ScrollView>
        </Frame>
      </div>
    </div>
  );
};
