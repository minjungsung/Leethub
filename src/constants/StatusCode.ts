export interface Response {
  html_url: string
  full_name: string
}

export const StatusCode = (
  res: Response,
  status: number,
  name: string
): void => {
  switch (status) {
    case 304:
      $('#success').hide()
      $('#error').text(
        `Error creating ${name} - Unable to modify repository. Try again later!`
      )
      $('#error').show()
      break

    case 400:
      $('#success').hide()
      $('#error').text(
        `Error creating ${name} - Bad POST request, make sure you're not overriding any existing scripts`
      )
      $('#error').show()
      break

    case 401:
      $('#success').hide()
      $('#error').text(
        `Error creating ${name} - Unauthorized access to repo. Try again later!`
      )
      $('#error').show()
      break

    case 403:
      $('#success').hide()
      $('#error').text(
        `Error creating ${name} - Forbidden access to repository. Try again later!`
      )
      $('#error').show()
      break

    case 422:
      $('#success').hide()
      $('#error').text(
        `Error creating ${name} - Unprocessable Entity. Repository may have already been created. Try Linking instead (select 2nd option).`
      )
      $('#error').show()
      break

    default:
      chrome.storage.local.set({ mode_type: 'commit' }, () => {
        $('#error').hide()
        $('#success').html(
          `Successfully created <a target="blank" href="${res.html_url}">${name}</a>. Start <a href="http://leetcode.com">LeetCoding</a>!`
        )
        $('#success').show()
        $('#unlink').show()
        document.getElementById('hook_mode')!.style.display = 'none'
        document.getElementById('commit_mode')!.style.display = 'inherit'
      })
      chrome.storage.local.set({ leethub_hook: res.full_name }, () => {
        console.log('Successfully set new repo hook')
      })
      break
  }
}
