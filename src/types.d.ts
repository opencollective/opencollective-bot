declare module 'probot-config' {
  import * as probot from 'probot'

  export default function<T>(
    context: probot.Context,
    fileName: string,
  ): Promise<T>
}
