<template>
  <div>
    <h1>index</h1>
    <div>{{ store.name }}</div>
    <button @click="store.increment">
      increment
    </button>
    <div>{{ store.count }}</div>
    <div>{{ languages.default }}</div>
  </div>
</template>

<script lang="ts" setup>
import { Ref } from 'vue'
import type { Story } from './../../src/runtime/composables/useStory'

const isEditorMode = computed(() => true)

const api = useStoryApi({
  version: 'draft',
  cacheVersion: false,
  languages: [
    {
      code: 'de',
      iso: 'de-DE',
      isDefault: true
    },
    {
      code: 'en',
      iso: 'en-US',
      isFallback: true
    }
  ],
  accessToken: '1A2uqoctnfDhzG0ByKpuswtt',
  cacheProvider: 'memory',
  isModeFieldLevel: true,
  isEditorMode
})

const dimensions = api.getDimensions({
  languages: ['en'],
  slug: '/'
})

const stories: Ref<Story[]> = ref([])

dimensions.then((s) => {
  stories.value = s
})

const store = useCounterStore()
store.increment()

const languages = useLanguages({
  languages: [{ code: 'de' }, { code: 'en', isDefault: true }]
})

const alternates = computed(() => stories.value.map(story => story.alternates).flat())

// console.log('isValid', languages.isValid('en'))

// const path = usePath({ path: 'de/test1/test2', languages })

// const slug = useSlug({ slug: 'de/test1/test2', languages })
// console.log(slug.payload.value)
// slug.create().addLeadingSlash().withoutLanguage().addLeadingSlash()
// console.log(slug.toString())
</script>
