'use client';

import type { Attachment, UIMessage } from 'ai';
import cx from 'classnames';
import type React from 'react';
import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
  type ChangeEvent,
  memo,
} from 'react';
import { toast } from 'sonner';
import { useLocalStorage, useWindowSize } from 'usehooks-ts';

import { GPSIcon, UploadIcon, StopIcon } from './icons';
import { PreviewAttachment } from './preview-attachment';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { ModelSelector } from './model-selector';
import { SearchModeSelector, type SearchMode } from './search-mode-selector';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { useScrollToBottom } from '@/hooks/use-scroll-to-bottom';
import type { VisibilityType } from './visibility-selector';
import { StarterPrompts } from './starter-prompts';

interface SessionUser {
  id: string;
  email?: string;
  name?: string;
  image?: string;
}

interface Session {
  user: SessionUser;
  expires: string;
}

interface Props {
  chatId: string;
  input: UseChatHelpers['input'];
  setInput: UseChatHelpers['setInput'];
  status: UseChatHelpers['status'];
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers['setMessages'];
  append: UseChatHelpers['append'];
  handleSubmit: UseChatHelpers['handleSubmit'];
  className?: string;
  selectedVisibilityType: VisibilityType;
  session: Session;
  selectedModelId: string;
  isHomePage?: boolean;
  selectedSearchMode: SearchMode;
  setSelectedSearchMode: (mode: SearchMode) => void;
}

function PureMultimodalInput({
  chatId,
  input,
  setInput,
  status,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  append,
  handleSubmit,
  className,
  selectedVisibilityType,
  session,
  selectedModelId,
  isHomePage = false,
  selectedSearchMode,
  setSelectedSearchMode,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();

  // Handle search mode change with page refresh
  const handleSearchModeChange = (mode: SearchMode) => {
    setSelectedSearchMode(mode);
    // Refresh the page to ensure new search mode is properly loaded
    window.location.reload();
  };

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    'input',
    '',
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration
      const finalValue = domValue || localStorageInput || '';
      setInput(finalValue);
    }
  }, []);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  const submitForm = useCallback(() => {
    window.history.replaceState({}, '', `/chat/${chatId}`);

    handleSubmit(undefined, {
      experimental_attachments: attachments,
    });

    setAttachments([]);
    setLocalStorageInput('');

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    attachments,
    handleSubmit,
    setAttachments,
    setLocalStorageInput,
    width,
    chatId,
  ]);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const { url, pathname, contentType } = data;

        return {
          url,
          name: pathname,
          contentType: contentType,
        };
      }
      const { error } = await response.json();
      toast.error(error);
    } catch (error) {
      toast.error('Failed to upload file, please try again!');
    }
  };

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined,
        );

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        console.error('Error uploading files!', error);
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments],
  );

  const { isAtBottom, scrollToBottom } = useScrollToBottom();
  const [isInitialMount, setIsInitialMount] = useState(true);

  // Prevent auto-scroll on initial page load, but allow it for new messages
  useEffect(() => {
    setIsInitialMount(false);
  }, []);

  // Restore auto-scroll when user submits a message (but not on initial mount)
  useEffect(() => {
    if (status === 'submitted' && !isInitialMount) {
      scrollToBottom();
    }
  }, [status, scrollToBottom, isInitialMount]);

  return (
    <div
      className={cx('relative w-full flex flex-col', {
        'gap-4': messages.length > 0,
        'gap-2': messages.length === 0,
      })}
    >
      <AnimatePresence>
        {!isAtBottom && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="absolute left-1/2 -translate-x-1/2 z-50"
            style={{ bottom: '4rem' }}
          >
            <Button
              data-testid="scroll-to-bottom-button"
              className="p-2 h-[34px] rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              onClick={(event) => {
                event.preventDefault();
                scrollToBottom();
              }}
              variant="ghost"
            >
              <ArrowDown size={12} />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {messages.length === 0 && (
        <>
          <input
            type="file"
            className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
            ref={fileInputRef}
            multiple
            onChange={handleFileChange}
            tabIndex={-1}
          />

          {(attachments.length > 0 || uploadQueue.length > 0) && (
            <div
              data-testid="attachments-preview"
              className="flex flex-row gap-2 overflow-x-scroll items-end"
            >
              {attachments.map((attachment) => (
                <PreviewAttachment
                  key={attachment.url}
                  attachment={attachment}
                />
              ))}

              {uploadQueue.map((filename) => (
                <PreviewAttachment
                  key={filename}
                  attachment={{
                    url: '',
                    name: filename,
                    contentType: '',
                  }}
                  isUploading={true}
                />
              ))}
            </div>
          )}

          <div className="relative">
            <Textarea
              data-testid="multimodal-input"
              ref={textareaRef}
              placeholder={
                isHomePage ? 'Ask anything...' : 'Ask Follow-up question'
              }
              value={input}
              onChange={handleInput}
              className={cx(
                'overflow-hidden resize-none',
                {
                  '!min-h-[110px]': isHomePage,
                  '!min-h-[50px]': !isHomePage,
                },
                'max-h-[calc(75dvh)]',
                'rounded-2xl !text-base pb-4 pr-14 pl-4 pt-4',
                'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm',
                'border border-gray-200 dark:border-gray-700',
                'shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10',
                'dark:shadow-black/20 dark:hover:shadow-black/30',
                'transition-all duration-300 ease-in-out',
                'placeholder:text-gray-400 dark:placeholder:text-gray-500',
                'focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/30',
                'focus:border-blue-500/50 dark:focus:border-blue-500/50',
                className,
              )}
              rows={1}
              onKeyDown={(event) => {
                if (
                  event.key === 'Enter' &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();

                  if (status !== 'ready') {
                    toast.error(
                      'Please wait for the model to finish its response!',
                    );
                  } else {
                    submitForm();
                  }
                }
              }}
            />

            <div className="absolute bottom-3 left-3 w-fit flex flex-row justify-start gap-2 items-center">
              {isHomePage && (
                <>
                  <SearchModeSelector
                    selectedSearchMode={selectedSearchMode}
                    onSearchModeChange={handleSearchModeChange}
                    className="p-2 h-[34px] text-xs"
                    compact={true}
                  />
                  <AttachmentsButton
                    fileInputRef={fileInputRef}
                    status={status}
                  />
                </>
              )}
            </div>

            <div className="absolute bottom-3 right-3 w-fit flex flex-row justify-end items-center">
              {status === 'submitted' ? (
                <StopButton stop={stop} setMessages={setMessages} />
              ) : (
                <SendButton
                  input={input}
                  submitForm={submitForm}
                  uploadQueue={uploadQueue}
                />
              )}
            </div>
          </div>

          <StarterPrompts
            className="mt-4"
            onSelectPrompt={(prompt: string) => {
              window.history.replaceState({}, '', `/chat/${chatId}`);
              append({
                role: 'user',
                content: prompt,
              });
            }}
          />
        </>
      )}

      {messages.length > 0 && (
        <>
          <input
            type="file"
            className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
            ref={fileInputRef}
            multiple
            onChange={handleFileChange}
            tabIndex={-1}
          />

          {(attachments.length > 0 || uploadQueue.length > 0) && (
            <div
              data-testid="attachments-preview"
              className="flex flex-row gap-2 overflow-x-scroll items-end"
            >
              {attachments.map((attachment) => (
                <PreviewAttachment
                  key={attachment.url}
                  attachment={attachment}
                />
              ))}

              {uploadQueue.map((filename) => (
                <PreviewAttachment
                  key={filename}
                  attachment={{
                    url: '',
                    name: filename,
                    contentType: '',
                  }}
                  isUploading={true}
                />
              ))}
            </div>
          )}

          <div className="relative">
            <Textarea
              data-testid="multimodal-input"
              ref={textareaRef}
              placeholder={
                isHomePage ? 'Ask anything...' : 'Ask Follow-up question'
              }
              value={input}
              onChange={handleInput}
              className={cx(
                'overflow-hidden resize-none',
                {
                  '!min-h-[110px]': isHomePage,
                  '!min-h-[50px]': !isHomePage,
                },
                'max-h-[calc(75dvh)]',
                'rounded-2xl !text-base pb-4 pr-14 pl-4 pt-4',
                'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm',
                'border border-gray-200 dark:border-gray-700',
                'shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10',
                'dark:shadow-black/20 dark:hover:shadow-black/30',
                'transition-all duration-300 ease-in-out',
                'placeholder:text-gray-400 dark:placeholder:text-gray-500',
                'focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/30',
                'focus:border-blue-500/50 dark:focus:border-blue-500/50',
                className,
              )}
              rows={1}
              onKeyDown={(event) => {
                if (
                  event.key === 'Enter' &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();

                  if (status !== 'ready') {
                    toast.error(
                      'Please wait for the model to finish its response!',
                    );
                  } else {
                    submitForm();
                  }
                }
              }}
            />

            <div className="absolute bottom-3 left-3 w-fit flex flex-row justify-start gap-2 items-center">
              {isHomePage && (
                <>
                  <SearchModeSelector
                    selectedSearchMode={selectedSearchMode}
                    onSearchModeChange={handleSearchModeChange}
                    className="p-2 h-[34px] text-xs"
                    compact={true}
                  />
                  <AttachmentsButton
                    fileInputRef={fileInputRef}
                    status={status}
                  />
                </>
              )}
            </div>

            <div className="absolute bottom-3 right-3 w-fit flex flex-row justify-end items-center">
              {status === 'submitted' ? (
                <StopButton stop={stop} setMessages={setMessages} />
              ) : (
                <SendButton
                  input={input}
                  submitForm={submitForm}
                  uploadQueue={uploadQueue}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) return false;
    if (prevProps.status !== nextProps.status) return false;
    if (!equal(prevProps.attachments, nextProps.attachments)) return false;
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType)
      return false;
    if (prevProps.selectedModelId !== nextProps.selectedModelId) return false;

    return true;
  },
);

function PureAttachmentsButton({
  fileInputRef,
  status,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  status: UseChatHelpers['status'];
}) {
  return (
    <Button
      data-testid="attachments-button"
      className="p-2 h-[34px] rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      onClick={(event) => {
        event.preventDefault();
        fileInputRef.current?.click();
      }}
      disabled={status !== 'ready'}
      variant="ghost"
    >
      <UploadIcon size={16} />
    </Button>
  );
}

const AttachmentsButton = memo(PureAttachmentsButton, () => true);

function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: UseChatHelpers['setMessages'];
}) {
  return (
    <Button
      className="p-2 h-[34px] rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => messages);
      }}
      variant="ghost"
    >
      <StopIcon size={16} />
    </Button>
  );
}

const StopButton = memo(PureStopButton, () => true);

function PureSendButton({
  submitForm,
  input,
  uploadQueue,
}: {
  submitForm: () => void;
  input: string;
  uploadQueue: Array<string>;
}) {
  return (
    <Button
      className="p-2 h-[34px] rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      onClick={(event) => {
        event.preventDefault();
        submitForm();
      }}
      disabled={input.length === 0 || uploadQueue.length > 0}
      variant="ghost"
    >
      <GPSIcon size={16} />
    </Button>
  );
}

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
  if (prevProps.uploadQueue.length !== nextProps.uploadQueue.length)
    return false;
  if (prevProps.input !== nextProps.input) return false;
  return true;
});
