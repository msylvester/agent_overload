import { AnimatePresence } from 'framer-motion';

export function ArtifactToolbar() {
  return (
    <AnimatePresence>
      {isCurrentVersion && (
        <Toolbar
          isToolbarVisible={isToolbarVisible}
          setIsToolbarVisible={setIsToolbarVisible}
          sendMessage={sendMessage}
          status={status}
          stop={stop}
          setMessages={setMessages}
          artifactKind={artifact.kind}
        />
      )}
    </AnimatePresence>
  );
}
