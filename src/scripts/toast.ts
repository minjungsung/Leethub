// Assuming the existence of a log function not defined in the provided code.
// This would need to be implemented or imported for the TypeScript version to work as expected.

enum ToastType {
  Danger = '#eb3b5a',
  Warning = '#fdcb6e',
  Success = '#00b894' // Corrected typo from "Succes" to "Success"
}

export class Toast {
  private message: string
  private color: string
  private time: number
  private element: HTMLElement | null

  constructor(message: string, color: string, time: number) {
    this.message = message
    this.color = color
    this.time = time
    this.element = null

    const element = document.createElement('div')
    element.className = 'toast-notification'
    this.element = element

    const countElements =
      document.getElementsByClassName('toast-notification').length

    element.style.opacity = '0.8'
    element.style.marginBottom = `${countElements * 55}px`
    element.style.backgroundColor = this.color

    const messageElement = document.createElement('div')
    messageElement.className = 'message-container'
    messageElement.textContent = this.message

    element.appendChild(messageElement)

    const close = document.createElement('div')
    close.className = 'close-notification'

    const icon = document.createElement('i')
    icon.className = 'lni lni-close'

    close.appendChild(icon)
    element.append(close)

    document.body.appendChild(element)

    setTimeout(() => {
      element.remove()
    }, this.time)

    element.addEventListener('click', () => {
      element.remove()
    })

    console.info('Closed')
  }

  static raiseToast(message: string, duration: number = 5000): Toast {
    return new Toast(message, ToastType.Danger, duration)
  }
}
