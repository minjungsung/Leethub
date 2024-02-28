import { uploadState } from "./variables"

// Assuming the existence of an uploadState object, you might need to define its structure
interface UploadState {
  uploading: boolean;
  countdown?: number; // Assuming countdown could be a number representing a timeout ID
}
// Removed the isNull function as it was causing linting issues
export function startUpload(): void {
  let elem = document.getElementById('BaekjoonHub_progress_anchor_element');
  if (!elem) {
    elem = document.createElement('span');
    elem.id = 'BaekjoonHub_progress_anchor_element';
    elem.className = 'runcode-wrapper__8rXm';
    elem.setAttribute('style', 'margin-left: 10px;padding-top: 0px;');
    document.body.appendChild(elem); // Assuming you want to append it to the body if the target element doesn't exist
  }
  elem.innerHTML = `<div id="BaekjoonHub_progress_elem" class="BaekjoonHub_progress"></div>`;
  const target = document.querySelector('#modal-dialog > div.modal-dialog > div.modal-content > div.modal-footer');
  if (target) {
    target.prepend(elem);
  }
  // start the countdown
  startUploadCountDown();
}

interface Branches {
  [key: string]: string;
}

export function markUploadedCSS(branches: Branches, directory: string): void {
  uploadState.uploading = false;
  const elem = document.getElementById('BaekjoonHub_progress_elem');
  if (!elem) return;
  elem.className = 'markuploaded';
  const uploadedUrl = `https://github.com/${Object.keys(branches)[0]}/tree/${Object.values(branches)[0]}/${directory}`;
  elem.addEventListener("click", function() {
    window.location.href = uploadedUrl;
  });
  elem.style.cursor = "pointer";
}

function markUploadFailedCSS(): void {
  uploadState.uploading = false;
  const elem = document.getElementById('BaekjoonHub_progress_elem');
  if (!elem) return;
  elem.className = 'markuploadfailed';
}

function startUploadCountDown(): void {
  uploadState.uploading = true;
  const countdownTimer = window.setTimeout(() => {
    if (uploadState.uploading) {
      markUploadFailedCSS();
    }
  }, 10000);
  // Extend the UploadState type definition to include countdownTimer
  (uploadState as any).countdownTimer = countdownTimer;
}

export function getDateString(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');

  return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}:${seconds}`;
}

export function isNotEmpty(value: any): boolean {
  return !isEmpty(value)
}

export function isEmpty(value: any): boolean {
  if (Array.isArray(value) || typeof value === 'string') {
    return value.length === 0
  }
  if (value !== null && typeof value === 'object') {
    return Object.keys(value).length === 0
  }
  return value === null || value === undefined
}

export function isNull(value: any): value is null | undefined {
  return value === null || value === undefined
}
