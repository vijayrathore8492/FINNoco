import * as Sentry from '@sentry/vue'
import { defineNuxtPlugin } from 'nuxt/app'
import { useGlobal } from '~/composables/useGlobal'

// https://localazy.com/blog/nuxt-3-tailwind-i18n-eslint-starter
// https://github.com/nuxt-community/sentry-module/issues/358
export default defineNuxtPlugin((nuxtApp) => {
  const { vueApp } = nuxtApp
  const { appInfo, user } = $(useGlobal())

  if (!appInfo.sentryDsnFrontend || !appInfo.platform) {
    return
  }

  Sentry.init({
    app: [vueApp],
    dsn: appInfo.sentryDsnFrontend,
    release: appInfo.version,
    environment: appInfo.platform,
    attachStacktrace: true,
    beforeSend(event, hint) {
      if (event.exception && appInfo.platform === 'development') {
        console.error(`[Exception handled by Sentry]: (${hint.originalException})`, { event, hint })
      }
      return event
    },
    initialScope: {
      user: { id: user?.id, email: user?.email },
    },
    enabled: Boolean(appInfo.platform),
  })

  Sentry.attachErrorHandler(vueApp, {
    logErrors: false,
    attachProps: true,
    trackComponents: true,
    timeout: 2000,
    hooks: ['activate', 'mount', 'update'],
  })

  return {
    provide: {
      sentrySetUser: Sentry.setUser,
      sentryAddBreadcrumb: Sentry.addBreadcrumb,
      sentryCaptureException: Sentry.captureException,
    },
  }
})
