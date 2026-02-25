<script>
  import { getContext } from 'svelte'
  import { t } from '../i18n'

  import Reply from './Reply.svelte'
  export let comment
  export let showReplyForm = false
  export let isChild = false

  const { showIndicator } = getContext('attrs')
</script>

<div
  class="my-6"
  class:pl-6={isChild}
  class:border-l-2={isChild}
  class:border-gray-200={isChild}
  class:cusdis-indicator={showIndicator}
>
  <div class="flex items-center mb-1">
    <div class="mr-2 font-black text-[17px] uppercase tracking-tight text-[#007bff] dark:text-[#007bff]">
      {comment.moderator && comment.moderator.displayName ? comment.moderator.displayName : comment.by_nickname}
    </div>

    {#if comment.moderatorId}
      <div class="mr-2 bg-[#c7af76] text-white text-[10px] py-0.5 px-2 font-bold rounded-sm uppercase tracking-wider">
        <span>{t('mod_badge')}</span>
      </div>
    {/if}
  </div>

  <div class="font-bold text-[11px] uppercase tracking-wider text-black opacity-60 mb-3">
    {comment.parsedCreatedAt}
  </div>

  <div class="text-slate-700 text-[15px] leading-relaxed mb-3 dark:text-gray-200">
    {@html comment.parsedContent}
  </div>

  <div class="mb-4">
    <button
      class="font-extrabold text-[11px] uppercase tracking-widest text-[#007bff] hover:text-black transition-colors"
      type="button"
      on:click={(_) => {
        showReplyForm = !showReplyForm
      }}>{t('reply_btn')}</button
    >
  </div>

  {#if comment.replies.data.length > 0}
    <div class="mt-2">
      {#each comment.replies.data as child (child.id)}
        <svelte:self isChild={true} comment={child} />
      {/each}
    </div>
  {/if}

  {#if showReplyForm}
    <div class="mt-4 pl-4 border-l-2 border-[#007bff]/30">
      <Reply
        parentId={comment.id}
        onSuccess={() => {
          showReplyForm = false
        }}
      />
    </div>
  {/if}
</div>
