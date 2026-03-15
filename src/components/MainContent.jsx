import React from 'react';
import useStore from '../hooks/useStore';
import PromptPanel from './PromptPanel';
import CodeEditor from './CodeEditor';
import SchematicView from './SchematicView';
import LibrariesPanel from './LibrariesPanel';
import UploadPanel from './UploadPanel';
import SerialMonitor from './SerialMonitor';

export default function MainContent() {
  const activeTab = useStore((s) => s.activeTab);

  return (
    <div className="flex-1 overflow-hidden">
      {activeTab === 'prompt' && <PromptPanel />}
      {activeTab === 'code' && <CodeEditor />}
      {activeTab === 'schematic' && <SchematicView />}
      {activeTab === 'libraries' && <LibrariesPanel />}
      {activeTab === 'upload' && <UploadPanel />}
      {activeTab === 'monitor' && <SerialMonitor />}
    </div>
  );
}
