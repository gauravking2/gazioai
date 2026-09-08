"use client";

import {
  ComposerAddAttachment,
  ComposerAttachments,
  UserMessageAttachments,
} from "@/components/attachment";
import { File } from "@/components/file";
import { ThreadFollowupSuggestions } from "@/components/follow-up-suggestions";
import { Image } from "@/components/image";
import { MarkdownText } from "@/components/markdown-text";
import {
  Reasoning,
  ReasoningContent,
  ReasoningRoot,
  ReasoningText,
  ReasoningTrigger,
} from "@/components/reasoning";
import { ToolFallback } from "@/components/tool-fallback";
import { ToolGroupContent, ToolGroupRoot, ToolGroupTrigger } from "@/components/tool-group";
import { TooltipIconButton } from "@/components/tooltip-icon-button";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_MODEL_ID } from "@/lib/models";
import { useModelStore } from "@/lib/model-store";
import { cn } from "@/lib/utils";
import {
  ActionBarMorePrimitive,
  ActionBarPrimitive,
  AuiIf,
  type AssistantState,
  BranchPickerPrimitive,
  ComposerPrimitive,
  ErrorPrimitive,
  groupPartByType,
  MessagePrimitive,
  ThreadPrimitive,
  type FileMessagePartComponent,
  type ImageMessagePartComponent,
  type ToolCallMessagePartComponent,
  useAui,
  useAuiState,
} from "@assistant-ui/react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BugIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CodeIcon,
  CopyIcon,
  DownloadIcon,
  GraduationCapIcon,
  LightbulbIcon,
  MicIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PenLineIcon,
  RefreshCwIcon,
  SparklesIcon,
  SquareIcon,
} from "lucide-react";
import {
  createContext,
  useContext,
  type ComponentType,
  type FC,
  type PropsWithChildren,
} from "react";

export type ThreadGroupPart = MessagePrimitive.GroupedParts.GroupPart;

/**
 * Optional component overrides for the thread. `AssistantMessage` and
 * `Welcome` replace whole sections; the remaining slots override how the
 * assistant message renders tool calls and part groups. Tool UIs registered
 * by name (toolkit `render`, `useAssistantDataUI`) take precedence over
 * `ToolFallback`.
 */
export type ThreadComponents = {
  AssistantMessage?: ComponentType | undefined;
  Welcome?: ComponentType | undefined;
  ToolFallback?: ToolCallMessagePartComponent | undefined;
  ToolGroup?: ComponentType<PropsWithChildren<{ group: ThreadGroupPart }>> | undefined;
  ReasoningGroup?: ComponentType<PropsWithChildren<{ group: ThreadGroupPart }>> | undefined;
};

export type ThreadProps = {
  components?: ThreadComponents | undefined;
};

const EMPTY_COMPONENTS: ThreadComponents = {};

const ThreadComponentsContext = createContext<ThreadComponents>(EMPTY_COMPONENTS);

// Startup exposes a loading placeholder thread; treat it as a new chat so
// the composer mounts centered. Loads after startup keep the docked layout.
const isNewChatView = (s: AssistantState) =>
  s.thread.messages.length === 0 && (!s.thread.isLoading || s.threads.isLoading);

// A switched thread that is still fetching its history: skeleton, not welcome.
const isHistoryLoadingView = (s: AssistantState) =>
  s.thread.messages.length === 0 &&
  s.thread.isLoading &&
  !s.thread.isDisabled &&
  !s.threads.isLoading;

const ThreadHistorySkeleton: FC = () => (
  <div
    data-slot="aui_thread-history-skeleton"
    role="status"
    className="animate-in fade-in fill-mode-both flex flex-col gap-y-6 [animation-delay:150ms] [animation-duration:200ms]"
  >
    <span className="sr-only">Loading conversation</span>
    <Skeleton className="ml-auto h-9 w-2/5 rounded-xl motion-reduce:animate-none" />
    <div className="flex flex-col gap-y-2">
      <Skeleton className="h-4 w-11/12 motion-reduce:animate-none" />
      <Skeleton className="h-4 w-4/5 motion-reduce:animate-none" />
      <Skeleton className="h-4 w-3/5 motion-reduce:animate-none" />
    </div>
    <Skeleton className="ml-auto h-9 w-1/3 rounded-xl motion-reduce:animate-none" />
    <div className="flex flex-col gap-y-2">
      <Skeleton className="h-4 w-10/12 motion-reduce:animate-none" />
      <Skeleton className="h-4 w-2/3 motion-reduce:animate-none" />
    </div>
  </div>
);

export const Thread: FC<ThreadProps> = ({ components = EMPTY_COMPONENTS }) => {
  const isEmpty = useAuiState(isNewChatView);

  return (
    <ThreadComponentsContext.Provider value={components}>
      <ThreadRoot isEmpty={isEmpty} />
    </ThreadComponentsContext.Provider>
  );
};

const ThreadRoot: FC<{ isEmpty: boolean }> = ({ isEmpty }) => {
  const { Welcome = ThreadWelcome } = useContext(ThreadComponentsContext);

  return (
    <ThreadPrimitive.Root
      className="aui-root aui-thread-root @container flex h-full flex-col bg-transparent"
      style={{
        ["--thread-max-width" as string]: "46rem",
        ["--composer-bg" as string]: "rgba(11, 11, 18, 0.72)",
        ["--composer-radius" as string]: "1.5rem",
        ["--composer-padding" as string]: "8px",
      }}
    >
      <ThreadPrimitive.Viewport
        turnAnchor="top"
        data-slot="aui_thread-viewport"
        className="gazioai-viewport relative flex flex-1 flex-col overflow-x-clip overflow-y-scroll scroll-smooth"
      >
        <div
          className={cn(
            "mx-auto flex w-full max-w-(--thread-max-width) flex-1 flex-col px-3 pt-4 sm:px-4 sm:pt-6",
            isEmpty && "justify-center",
          )}
        >
          <AuiIf condition={isNewChatView}>
            <Welcome />
          </AuiIf>
          <AuiIf condition={isHistoryLoadingView}>
            <ThreadHistorySkeleton />
          </AuiIf>

          <div
            data-slot="aui_message-group"
            className="mb-14 flex flex-col gap-y-7 empty:hidden sm:gap-y-8"
          >
            <ThreadPrimitive.Messages>{() => <ThreadMessage />}</ThreadPrimitive.Messages>
          </div>

          <ThreadPrimitive.ViewportFooter
            className={cn(
              "aui-thread-viewport-footer sticky bottom-0 z-10 flex flex-col gap-3 overflow-visible px-1 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-2 md:pb-6",
              isEmpty ? "mt-2" : "mt-auto",
            )}
          >
            <ThreadScrollToBottom />
            <ThreadFollowupSuggestions />
            <Composer />
            <AuiIf condition={(s) => isNewChatView(s) && s.composer.isEmpty}>
              <ThreadSuggestions />
            </AuiIf>
          </ThreadPrimitive.ViewportFooter>
        </div>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
};

const ThreadMessage: FC = () => {
  const { AssistantMessage: AssistantMessageComponent = AssistantMessage } =
    useContext(ThreadComponentsContext);
  const role = useAuiState((s) => s.message.role);
  const isEditing = useAuiState((s) => s.message.composer.isEditing);

  if (isEditing) return <EditComposer />;
  if (role === "user") return <UserMessage />;
  return <AssistantMessageComponent />;
};

const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom
      render={
        <TooltipIconButton
          tooltip="Scroll to bottom"
          variant="outline"
          className="aui-thread-scroll-to-bottom absolute -top-14 z-10 self-center rounded-full border-white/10 bg-[#0b0b12]/90 p-4 shadow-xl shadow-black/40 hover:bg-[#15151f] disabled:invisible"
        />
      }
    >
      <ArrowDownIcon />
    </ThreadPrimitive.ScrollToBottom>
  );
};

const ThreadWelcome: FC = () => {
  return (
    <div className="aui-thread-welcome-root mb-5 flex flex-col items-center px-4 text-center sm:mb-7">
      <div
        aria-hidden="true"
        className="gazioai-welcome-mark fade-in slide-in-from-bottom-2 animate-in fill-mode-both duration-300 motion-reduce:animate-none"
      >
        ✦
      </div>
      <p className="gazioai-welcome-eyebrow fade-in slide-in-from-bottom-2 animate-in mt-5 fill-mode-both duration-300 [animation-delay:60ms] motion-reduce:animate-none">
        GAZIOAI
      </p>
      <h1 className="gazioai-welcome-title fade-in slide-in-from-bottom-2 animate-in mt-2 max-w-md fill-mode-both text-[28px] leading-tight font-semibold tracking-tight duration-300 [animation-delay:120ms] motion-reduce:animate-none sm:text-4xl">
        What can I help you with?
      </h1>
      <p className="fade-in slide-in-from-bottom-2 animate-in mt-2.5 max-w-sm fill-mode-both text-sm leading-6 text-white/45 duration-300 [animation-delay:200ms] motion-reduce:animate-none">
        Ask anything — code, ideas, debugging, writing.
      </p>
    </div>
  );
};

const WELCOME_PROMPTS: {
  icon: typeof CodeIcon;
  label: string;
  title: string;
  prompt: string;
}[] = [
  {
    icon: CodeIcon,
    label: "Code",
    title: "Write a script that renames files by date",
    prompt:
      "Write a Python script that renames all files in a folder based on their creation date.",
  },
  {
    icon: LightbulbIcon,
    label: "Explain",
    title: "How does React useEffect actually work?",
    prompt: "Explain how React's useEffect hook works, with a simple example and common mistakes.",
  },
  {
    icon: PenLineIcon,
    label: "Write",
    title: "Draft a friendly follow-up email",
    prompt: "Write a short, friendly follow-up email to a client who hasn't responded in a week.",
  },
  {
    icon: BugIcon,
    label: "Debug",
    title: "Help me find the bug in my code",
    prompt: "I have a function that throws an error. Help me find the root cause and fix it.",
  },
  {
    icon: SparklesIcon,
    label: "Ideas",
    title: "Brainstorm names for my side project",
    prompt:
      "Brainstorm 10 creative names for a minimalist productivity side project, with a one-line rationale for each.",
  },
  {
    icon: GraduationCapIcon,
    label: "Learn",
    title: "Teach me the basics of SQL joins",
    prompt: "Teach me the basics of SQL joins with small examples I can run.",
  },
];

const ThreadSuggestions: FC = () => {
  return (
    <div className="gazioai-suggestions-grid aui-thread-welcome-suggestions grid w-full grid-cols-1 gap-2 pb-1 sm:grid-cols-2 sm:gap-2.5">
      {WELCOME_PROMPTS.map((item) => (
        <ThreadPrimitive.Suggestion
          key={item.label}
          prompt={item.prompt}
          method="replace"
          autoSend
          className="gazioai-suggestion-card fade-in slide-in-from-bottom-2 animate-in fill-mode-both duration-300 motion-reduce:animate-none"
        >
          <span className="gazioai-suggestion-icon" aria-hidden="true">
            <item.icon className="size-4" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col text-left">
            <span className="gazioai-suggestion-label">{item.label}</span>
            <span className="gazioai-suggestion-text mt-0.5">{item.title}</span>
          </span>
        </ThreadPrimitive.Suggestion>
      ))}
    </div>
  );
};

const Composer: FC = () => {
  return (
    <ComposerPrimitive.Root className="aui-composer-root relative flex w-full flex-col">
      <ComposerPrimitive.AttachmentDropzone
        render={
          <div
            data-slot="aui_composer-shell"
            className="gazioai-composer composer-glow data-[dragging=true]:border-violet-400/50 focus-within:border-violet-400/30 flex w-full cursor-text flex-col gap-2 rounded-(--composer-radius) border border-white/10 bg-(--composer-bg) p-(--composer-padding) backdrop-blur-xl transition-[border-color,box-shadow] duration-200 data-[dragging=true]:border-dashed data-[dragging=true]:bg-violet-500/[0.06]"
          />
        }
      >
        <ComposerAttachments />
        <ComposerPrimitive.Input
          placeholder="Ask GAZIOAI anything..."
          className="aui-composer-input caret-violet-400 placeholder:text-muted-foreground/60 max-h-48 min-h-11 w-full resize-none bg-transparent px-3 py-1.5 text-[15px] leading-6 outline-none"
          rows={1}
          autoFocus
          enterKeyHint="send"
          aria-label="Message input"
        />
        <ComposerAction />
      </ComposerPrimitive.AttachmentDropzone>
    </ComposerPrimitive.Root>
  );
};

const ComposerAction: FC = () => {
  return (
    <div className="aui-composer-action-wrapper relative flex items-center justify-between gap-2">
      <ComposerAddAttachment />
      <div className="flex items-center gap-1.5">
        <AuiIf condition={(s) => s.thread.capabilities.dictation}>
          <AuiIf condition={(s) => s.composer.dictation == null}>
            <ComposerPrimitive.Dictate
              render={
                <TooltipIconButton
                  tooltip="Voice input"
                  side="bottom"
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="aui-composer-dictate text-muted-foreground hover:text-foreground size-8 rounded-full"
                  aria-label="Start voice input"
                />
              }
            >
              <MicIcon className="aui-composer-dictate-icon size-4" />
            </ComposerPrimitive.Dictate>
          </AuiIf>
          <AuiIf condition={(s) => s.composer.dictation != null}>
            <ComposerPrimitive.StopDictation
              render={
                <TooltipIconButton
                  tooltip="Stop dictation"
                  side="bottom"
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="aui-composer-stop-dictation text-destructive size-8 rounded-full"
                  aria-label="Stop voice input"
                />
              }
            >
              <SquareIcon className="aui-composer-stop-dictation-icon size-3.5 animate-pulse fill-current" />
            </ComposerPrimitive.StopDictation>
          </AuiIf>
        </AuiIf>
        <AuiIf condition={(s) => !s.thread.isRunning}>
          <ComposerPrimitive.Send
            render={
              <TooltipIconButton
                tooltip="Send message"
                side="bottom"
                type="button"
                variant="default"
                size="icon"
                className="btn-primary aui-composer-send size-9 rounded-full"
                aria-label="Send message"
              />
            }
          >
            <ArrowUpIcon className="aui-composer-send-icon size-4" />
          </ComposerPrimitive.Send>
        </AuiIf>
        <AuiIf condition={(s) => s.thread.isRunning}>
          <ComposerPrimitive.Cancel
            render={
              <Button
                type="button"
                variant="default"
                size="icon"
                className="btn-primary aui-composer-cancel size-9 rounded-full"
                aria-label="Stop generating"
              />
            }
          >
            <SquareIcon className="aui-composer-cancel-icon size-3.5 fill-current" />
          </ComposerPrimitive.Cancel>
        </AuiIf>
      </div>
    </div>
  );
};

const MessageError: FC = () => {
  const setModelId = useModelStore((s) => s.setModelId);
  const aui = useAui();

  return (
    <div>
      <MessagePrimitive.Error>
        <ErrorPrimitive.Root className="aui-message-error-root border-destructive/40 bg-destructive/10 text-destructive dark:bg-destructive/5 mt-2 rounded-xl border p-3 text-sm dark:text-red-200">
          <ErrorPrimitive.Message className="aui-message-error-message line-clamp-2" />
        </ErrorPrimitive.Root>
      </MessagePrimitive.Error>
      <button
        type="button"
        className="gazioai-error-action"
        onClick={() => {
          setModelId(DEFAULT_MODEL_ID);
          void aui.message.reload();
        }}
      >
        <RefreshCwIcon className="size-3.5" />
        Retry with Auto (Best Free)
      </button>
    </div>
  );
};

const AssistantMessage: FC = () => {
  const {
    ToolFallback: ToolFallbackComponent = ToolFallback,
    ToolGroup,
    ReasoningGroup,
  } = useContext(ThreadComponentsContext);

  const ACTION_BAR_PT = "pt-1.5";
  // Keep the action bar inside the contained root's paint box, then cancel its reserved space in flow.
  const ACTION_BAR_HEIGHT = `min-h-7.5 ${ACTION_BAR_PT}`;

  return (
    <MessagePrimitive.Root
      data-slot="aui_assistant-message-root"
      data-role="assistant"
      className="fade-in slide-in-from-bottom-1 animate-in relative -mb-7.5 pb-7.5 duration-150 [contain-intrinsic-size:auto_200px] [content-visibility:auto] motion-reduce:animate-none"
    >
      <div className="flex gap-3">
        <div className="gazioai-assistant-avatar hidden shrink-0 sm:flex" aria-hidden="true">
          ✦
        </div>
        <div className="min-w-0 flex-1">
          <div
            data-slot="aui_assistant-message-content"
            className="text-foreground min-w-0 px-1 leading-relaxed wrap-break-word sm:px-2"
          >
            <MessagePrimitive.GroupedParts
              groupBy={groupPartByType({
                reasoning: ["group-chainOfThought", "group-reasoning"],
                "tool-call": ["group-chainOfThought", "group-tool"],
                "standalone-tool-call": [],
              })}
            >
              {({ part, children }) => {
                switch (part.type) {
                  case "group-chainOfThought":
                    return <div data-slot="aui_chain-of-thought">{children}</div>;
                  case "group-tool":
                    if (ToolGroup) {
                      return <ToolGroup group={part}>{children}</ToolGroup>;
                    }
                    return (
                      <ToolGroupRoot variant="ghost">
                        <ToolGroupTrigger
                          count={part.indices.length}
                          active={part.status.type === "running"}
                        />
                        <ToolGroupContent>{children}</ToolGroupContent>
                      </ToolGroupRoot>
                    );
                  case "group-reasoning": {
                    if (ReasoningGroup) {
                      return <ReasoningGroup group={part}>{children}</ReasoningGroup>;
                    }
                    const running = part.status.type === "running";
                    return (
                      <ReasoningRoot streaming={running}>
                        <ReasoningTrigger active={running} />
                        <ReasoningContent aria-busy={running}>
                          <ReasoningText>{children}</ReasoningText>
                        </ReasoningContent>
                      </ReasoningRoot>
                    );
                  }
                  case "text":
                    return <MarkdownText />;
                  case "reasoning":
                    return <Reasoning {...part} />;
                  case "tool-call":
                    return part.toolUI ?? <ToolFallbackComponent {...part} />;
                  case "data":
                    return part.dataRendererUI;
                  case "file":
                    return (
                      <div data-slot="aui_assistant-message-file" className="py-1">
                        <File {...part} />
                      </div>
                    );
                  case "image":
                    return (
                      <div data-slot="aui_assistant-message-image" className="py-1">
                        <Image {...part} />
                      </div>
                    );
                  case "indicator":
                    return (
                      <span
                        data-slot="aui_assistant-message-indicator"
                        className="gazioai-thinking"
                        role="status"
                        aria-label="Assistant is thinking"
                      >
                        <span className="typing-indicator" aria-hidden="true">
                          <span />
                          <span />
                          <span />
                        </span>
                        <span className="gazioai-thinking-label" aria-hidden="true">
                          Thinking
                        </span>
                      </span>
                    );
                  default:
                    return null;
                }
              }}
            </MessagePrimitive.GroupedParts>
            <MessageError />
          </div>

          <div
            data-slot="aui_assistant-message-footer"
            className={cn("gazioai-action-bar ms-1 flex items-center", ACTION_BAR_HEIGHT)}
          >
            <BranchPicker />
            <AssistantActionBar />
          </div>
        </div>
      </div>
    </MessagePrimitive.Root>
  );
};

const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="aui-assistant-action-bar-root text-muted-foreground animate-in fade-in col-start-3 row-start-2 -ms-1 flex gap-0.5 duration-200"
    >
      <ActionBarPrimitive.Copy render={<TooltipIconButton tooltip="Copy" />}>
        <AuiIf condition={(s) => s.message.isCopied}>
          <CheckIcon className="animate-in zoom-in-50 fade-in duration-200 ease-out" />
        </AuiIf>
        <AuiIf condition={(s) => !s.message.isCopied}>
          <CopyIcon className="animate-in zoom-in-75 fade-in duration-150" />
        </AuiIf>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload render={<TooltipIconButton tooltip="Regenerate response" />}>
        <RefreshCwIcon />
      </ActionBarPrimitive.Reload>
      <ActionBarMorePrimitive.Root>
        <ActionBarMorePrimitive.Trigger
          render={<TooltipIconButton tooltip="More" className="data-[state=open]:bg-accent" />}
        >
          <MoreHorizontalIcon />
        </ActionBarMorePrimitive.Trigger>
        <ActionBarMorePrimitive.Content
          side="bottom"
          align="start"
          sideOffset={6}
          className="aui-action-bar-more-content bg-popover text-popover-foreground data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:animate-out data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] overflow-hidden rounded-xl border p-1.5"
        >
          <ActionBarPrimitive.ExportMarkdown
            render={
              <ActionBarMorePrimitive.Item className="aui-action-bar-more-item hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm outline-none select-none" />
            }
          >
            <DownloadIcon className="size-4" />
            Export as Markdown
          </ActionBarPrimitive.ExportMarkdown>
        </ActionBarMorePrimitive.Content>
      </ActionBarMorePrimitive.Root>
    </ActionBarPrimitive.Root>
  );
};

const UserFilePart: FileMessagePartComponent = (part) => (
  <div data-slot="aui_user-message-file" className="py-1">
    <File {...part} />
  </div>
);

const UserImagePart: ImageMessagePartComponent = (part) => (
  <div data-slot="aui_user-message-image" className="py-1">
    <Image {...part} />
  </div>
);

// Stable parts map: creating this object inline would re-render every part on
// each streamed token.
const userPartComponents = { File: UserFilePart, Image: UserImagePart } as const;

const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root
      data-slot="aui_user-message-root"
      className="fade-in slide-in-from-bottom-1 animate-in flex flex-col items-end gap-y-2 duration-150 [contain-intrinsic-size:auto_200px] [content-visibility:auto] motion-reduce:animate-none"
      data-role="user"
    >
      <div className="flex w-full justify-end empty:hidden">
        <UserMessageAttachments />
      </div>

      <div className="flex max-w-[88%] flex-col items-end sm:max-w-[80%]">
        <div className="aui-user-message-content peer gazioai-user-bubble text-foreground rounded-2xl rounded-br-lg px-4 py-2.5 wrap-break-word empty:hidden">
          <MessagePrimitive.Parts components={userPartComponents} />
        </div>
        <div className="flex items-center justify-end peer-empty:hidden">
          <BranchPicker className="-me-1" />
          <UserActionBar />
        </div>
      </div>
    </MessagePrimitive.Root>
  );
};

const UserActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="aui-user-action-bar-root gazioai-action-bar flex items-center"
    >
      <ActionBarPrimitive.Edit
        render={<TooltipIconButton tooltip="Edit message" className="aui-user-action-edit" />}
      >
        <PencilIcon />
      </ActionBarPrimitive.Edit>
    </ActionBarPrimitive.Root>
  );
};

const EditComposer: FC = () => {
  return (
    <MessagePrimitive.Root
      data-slot="aui_edit-composer-wrapper"
      className="flex flex-col [contain-intrinsic-size:auto_200px] [content-visibility:auto]"
    >
      <ComposerPrimitive.Root className="aui-edit-composer-root border-border/60 dark:border-muted-foreground/15 ms-auto flex w-full max-w-[88%] cursor-text flex-col rounded-2xl border bg-(--composer-bg) sm:max-w-[80%]">
        <ComposerPrimitive.Input
          className="aui-edit-composer-input text-foreground min-h-14 w-full resize-none bg-transparent px-4 pt-3 pb-1 text-[15px] outline-none"
          autoFocus
        />
        <div className="aui-edit-composer-footer mx-2.5 mb-2.5 flex items-center gap-1.5 self-end">
          <ComposerPrimitive.Cancel
            render={<Button variant="ghost" size="sm" className="h-8 rounded-full px-3.5" />}
          >
            Cancel
          </ComposerPrimitive.Cancel>
          <ComposerPrimitive.Send render={<Button size="sm" className="h-8 rounded-full px-3.5" />}>
            Update
          </ComposerPrimitive.Send>
        </div>
      </ComposerPrimitive.Root>
    </MessagePrimitive.Root>
  );
};

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({ className, ...rest }) => {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className={cn(
        "aui-branch-picker-root text-muted-foreground -ms-2 me-2 inline-flex items-center text-xs",
        className,
      )}
      {...rest}
    >
      <BranchPickerPrimitive.Previous render={<TooltipIconButton tooltip="Previous" />}>
        <ChevronLeftIcon />
      </BranchPickerPrimitive.Previous>
      <span className="aui-branch-picker-state font-medium">
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next render={<TooltipIconButton tooltip="Next" />}>
        <ChevronRightIcon />
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
};
