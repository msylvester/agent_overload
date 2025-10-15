import { AnimatePresence, motion } from 'framer-motion';
import { useWindowSize } from 'usehooks-ts';
import { useSidebar } from './ui/sidebar';
import { MultimodalInput } from './multimodal-input';
import { ArtifactMessages } from './artifact-messages';

export function ArtifactSidebar() {
  const { open: isSidebarOpen } = useSidebar();
  const { width: windowWidth } = useWindowSize();

  const isMobile = windowWidth ? windowWidth < 768 : false;

  return (
    <>
      {!isMobile ? (
        <motion.div
          className="fixed bg-background h-dvh"
          initial={{
            width: isSidebarOpen ? windowWidth - 256 : windowWidth,
            right: 0,
          }}
          animate={{ width: windowWidth, right: 0 }}
          exit={{
            width: isSidebarOpen ? windowWidth - 256 : windowWidth,
            right: 0,
          }}
        />
      ) : null}

      {!isMobile && (
        <motion.div
          className="relative w-[400px] bg-muted dark:bg-background h-dvh shrink-0"
          initial={{ opacity: 0, x: 10, scale: 1 }}
          animate={{
            opacity: 1,
            x: 0,
            scale: 1,
            transition: {
              delay: 0.2,
              type: 'spring',
              stiffness: 200,
              damping: 30,
            },
          }}
          exit={{
            opacity: 0,
            x: 0,
            scale: 1,
            transition: { duration: 0 },
          }}
        >
          <AnimatePresence>
            {!isCurrentVersion && (
              <motion.div
                className="left-0 absolute h-dvh w-[400px] top-0 bg-zinc-900/50 z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            )}
          </AnimatePresence>

          <div className="flex flex-col h-full justify-between items-center">
            <ArtifactMessages
              chatId={chatId}
              status={status}
              votes={votes}
              messages={messages}
              setMessages={setMessages}
              regenerate={regenerate}
              isReadonly={isReadonly}
              artifactStatus={artifact.status}
            />

            <form className="flex flex-row gap-2 relative items-end w-full px-4 pb-4">
              <MultimodalInput
                chatId={chatId}
                input={input}
                setInput={setInput}
                status={status}
                stop={stop}
                attachments={attachments}
                setAttachments={setAttachments}
                messages={messages}
                sendMessage={sendMessage}
                className="bg-background dark:bg-muted"
                setMessages={setMessages}
                selectedVisibilityType={selectedVisibilityType}
              />
            </form>
          </div>
        </motion.div>
      )}
    </>
  );
}
