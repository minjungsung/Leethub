import '../css/popup.css'

import React, { useState, useEffect, useCallback } from 'react'
import browser from 'webextension-polyfill'
import { oAuth2 } from '../scripts/oauth2'
import { WELCOME_URL } from '../constants/Url'
import { getStats, getHook, getIsEnabled, saveIsEnabled } from '../scripts/storage';

const Popup: React.FC = () => {
  const [mode, setMode] = useState<'auth' | 'hook' | 'commit'>('auth')
  const [leethubHook, setLeethubHook] = useState<string>(WELCOME_URL)
  const [stats, setStats] = useState({ solved: 0, easy: 0, medium: 0, hard: 0 })
  const [isEnabled, setIsEnabledState] = useState<boolean>(false); // Renamed state setter for clarity

  const updateComponentState = useCallback(async () => {
    const currentStatsData = await getStats(); // Use exported function
    const hook = await getHook();       // Use exported function
    const enabled = await getIsEnabled(); // Use new exported function

    // Extract difficulty counts from stats.problems or default to 0
    const solvedCount = currentStatsData?.problems ? Object.keys(currentStatsData.problems).length : 0;
    const easyCount = currentStatsData?.problems ? Object.values(currentStatsData.problems).filter((p: any) => p.difficulty === 'Easy').length : 0;
    const mediumCount = currentStatsData?.problems ? Object.values(currentStatsData.problems).filter((p: any) => p.difficulty === 'Medium').length : 0;
    const hardCount = currentStatsData?.problems ? Object.values(currentStatsData.problems).filter((p: any) => p.difficulty === 'Hard').length : 0;

    setStats({
      solved: solvedCount,
      easy: easyCount,
      medium: mediumCount,
      hard: hardCount
    });

    if (hook) {
      setLeethubHook(hook);
    }
    setIsEnabledState(enabled);
  }, []);

  useEffect(() => {
    browser.storage.local
      .get(['leethub_token', 'mode_type', 'leethub_hook']) // No need to get bjhEnable here directly
      .then(async (data: Record<string, any>) => {
        const { leethub_token, mode_type, leethub_hook } = data;
        // Fetch enabled status using the new function
        const enabledStatus = await getIsEnabled();
        setIsEnabledState(enabledStatus);

        if (!leethub_token) {
          setMode('auth')
        } else if (leethub_token && !leethub_hook) {
          setMode('hook')
          setLeethubHook(WELCOME_URL); // Ensure hook is reset if not present
        } else {
          setMode('commit')
          setLeethubHook(leethub_hook); // Set the hook URL
          updateComponentState(); // Fetch stats and enabled status
        }
      });

    // Add listener for storage changes
    const handleStorageChange = (changes: Record<string, browser.Storage.StorageChange>, areaName: string) => {
      if (areaName === 'local' && (changes.stats || changes.leethub_hook || changes.bjhEnable)) {
        console.log('Storage changed, updating popup state:', changes);
        updateComponentState(); // Re-fetch stats, hook, and enabled status on change
        // Update mode based on token/hook availability after potential auth changes
        browser.storage.local.get(['leethub_token', 'leethub_hook']).then(d => {
          if (!d.leethub_token) setMode('auth');
          else if (!d.leethub_hook) setMode('hook');
          else setMode('commit');
        });
      }
    };

    browser.storage.onChanged.addListener(handleStorageChange);

    // Cleanup listener on unmount
    return () => {
      browser.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [updateComponentState])

  const authenticate = () => {
    oAuth2.begin()
  }

  // Handler for the toggle switch
  const handleToggleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setIsEnabledState(checked);
    try {
      await saveIsEnabled(checked); // Use new exported function
      console.log('bjhEnable saved:', checked);
    } catch (error) {
      console.error('Error saving bjhEnable:', error);
    }
  };

  return (
    <div className='ui grid container'>
      <div className='sixteen wide center aligned column'>
        <h1 id='title'>
          Leet<span style={{ color: '#f18500' }}>Hub</span>
        </h1>
        <p id='caption'>Sync your code from LeetCode to GitHub</p>
        <br />
        {mode === 'auth' && (
          <div id='auth_mode'>
            <button
              className='ui secondary button'
              onClick={authenticate}
            >
              <i className='icon github'></i> Authenticate
            </button>
          </div>
        )}
        {mode === 'hook' && (
          <div id='hook_mode'>
            <a
              className='ui secondary button'
              href={leethubHook || WELCOME_URL} // Use state or default
              target='_blank'
              rel='noopener noreferrer'
            >
              <i className='icon github'></i> Set up Hook
            </a>
          </div>
        )}
        {mode === 'commit' && (
          <div id='commit_mode'>
            <p>
              Repository:{' '}
              <a
                href={leethubHook || '#'} // Use state or placeholder
                target='_blank'
                rel='noopener noreferrer'
              >
                {leethubHook || 'Not Set'}
              </a>
            </p>
            <div className="ui toggle checkbox">
              <input
                type="checkbox"
                name="enableIntegration"
                checked={isEnabled} // Use the state variable
                onChange={handleToggleChange}
              />
              <label>Enable LeetCode/Programmers Auto Upload</label>
            </div>
            {/* Display more stats as needed */}
          </div>
        )}
      </div>
    </div>
  )
}

export default Popup
