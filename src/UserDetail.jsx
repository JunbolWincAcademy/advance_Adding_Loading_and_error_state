import { useEffect, useState } from 'react';

//--------flakyFetch component----------
const flakyFetch = async (url) => {
  // Sleep for a bit to simulate loading.
  await new Promise((r) => setTimeout(r, 1000));

  // 1/6 requests throw a JavaScript error
  const randomValue = Math.random() * 100;
  if (randomValue <= 16) {
    throw new Error('The server did not respond');
  }

  // 1/6 responses return an invalid response
  let response = await fetch(url);
  if (randomValue <= 32) {
    const data = { error: 'Server error' };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });

    const init = { status: 500, statusText: 'Server Error' };
    response = new Response(blob, init);
  }
  return response;
};
//--------UserDetail component----------
export const UserDetail = ({ user }) => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false); //🚩isLoading state
  const [error, setError] = useState({ happened: false, msg: '' });

  useEffect(() => {
    let ignore = false;
    setPosts([]);
    setIsLoading(true); //🚩set it to true
    setError({ happened: false, msg: '' }); //🚩reset error. Some NOTES added below why it's important to reset the error here at the beginning of useEffect

    const fetchUserPosts = async () => {
      try {
        //try will wrap the fetching
        // Attempt to execute code that may fail
        const response = await flakyFetch(`http://localhost:3000/users/${user.id}/posts`);
        // If the above line doesn't throw an error, this code continues to execute
        if (!response.ok) {
          // ✅ Check if the response was not OK, and handle it as an error.
          //check how this works below on the NOTES
          setError({
            happened: true,
            msg: `Fetch error: ${response.status} ${response.statusText}`, // ✅ Use status and statusText for detailed error message
          });
          setIsLoading(false);
          return; // ✅ Exit early since there's an error
        }

        const posts = await response.json(); // Correctly retrieving the posts from the response

        /* 
        
the main reason of moving it outside the if(!ignore) block is because in the next render ingnore wil be true.So this line wont run.

Moving const posts = await response.json(); outside of the if (!ignore) block and before setting the state ensures that you always parse the response as JSON right after checking response.ok for errors. This organization makes the code clearer and ensures that JSON parsing and state updates occur in the correct order: after ensuring the response is OK and before potentially exiting due to the component being unmounted. 

Parsing JSON means converting the JSON formatted text in the response body into a JavaScript object. This is what await response.json(); does. It's an essential step after fetching data because the raw result from fetch is not directly usable as an object in your JavaScript code.
Parsing Response JSON Outside of the !ignore Check: The current placement of const posts = await response.json(); is within the if (!ignore) check. This is slightly misaligned with the ideal pattern. The JSON parsing should ideally occur before the ignore check to ensure that the operation is not dependent on the component's mount state. Instead, what should be inside the !ignore check is the state update logic (setPosts(posts) and setIsLoading(false)), as you want to prevent these operations if the component unmounts.This adjustment ensures that parsing the response to JSON happens regardless of the component's mount state, but state updates are protected against being executed after the component has unmounted.

Regarding JSON Parsing Position Relative to the !ignore Check: The parsing of the response (const posts = await response.json();) should indeed happen before any conditional checks related to component state updates, like the !ignore check. This ensures that the data is ready and parsed for when you need to update the state, assuming the operation should proceed (i.e., the component hasn't unmounted).

State Updates Inside the !ignore Check: Only the operations that update the component's state (setPosts(posts) and setIsLoading(false)) need to be within the !ignore condition. This ensures that if the component has been unmounted before these operations are executed, you don't attempt to update the state of an unmounted component, which would lead to errors.
Why This Approach? Parsing the response to JSON outside the !ignore check ensures that any potential errors during parsing are caught in the try-catch block. The conditional rendering based on the ignore flag should only guard against updates to the component state (like setting posts or loading state), which can lead to errors if the component has unmounted.*/

        if (!ignore) {
          // if ignore NOT false which mean if  it is true then DON’T run the code bellow, but since it is false then run the code below

          setPosts(posts);
          setIsLoading(false); // Successfully finished loading
        }
      } catch (error) {
        // This block below executes if the try block throws an error
        if (!ignore) {
          //✅ Check ignore flag before setting state
          console.log('An error occurred:', error.message);
          // Correctly handle the error by setting the error state
          setError({
            //updating error state
            happened: true, //✅ Ensure you have this line
            msg: error.message, //✅ Ensure you're passing the error message correctly
          });
          setIsLoading(false); // Also ensure to stop the loading state in case of an error
        }
      }
    };

    fetchUserPosts();

    return () => {
      //✅ cleanup function
      ignore = true; //✅ Set ignore to true on cleanup
    };
  }, [user]);
  // Use if-statements for handling multiple conditions for clarity and maintainability, especially in scenarios with more than two conditions or when the conditions themselves are complex. Reserve nested ternary operators for simpler conditions where readability is not significantly impacted.
if (error) {
  return (<p>Error</p>);
}

if (isLoading) {
  return (<p>Loading..</p>);
}

  return (
    <div className="user-details">
      <p>{user.name}</p>
      <p>{user.email}</p>
      <ul>
        {posts &&
          posts.map((post) => (
            <li key={post.id}>
              <b>{post.title}</b>
              <p>{post.body}</p>
            </li>
          ))}
      </ul>
    </div>
  );
};

//NOTES on Error Resetting on UseEffect:

/* Resetting the error state within useEffect each time it runs is crucial for handling subsequent fetch operations correctly. When you first define the error state outside of useEffect with useState, you're setting its initial state for the first render of the component. However, during the component's lifecycle, especially in applications that involve fetching data based on user interactions or other changing conditions, the same component might initiate multiple fetch operations.

Here's why resetting the error state (and similarly, other relevant states like isLoading and posts) at the beginning of each useEffect call is important:

Fresh State for New Operations: Each fetch operation is distinct. Previous error states should not affect the new operations. Resetting ensures that each operation starts with a clean slate, reflecting the current operation's actual status.

Accuracy of UI Feedback: Consider a user action that leads to a fetch operation which then fails, setting an error state. If the user tries again and the operation is successful this time, but you didn't reset the error state at the start of the operation, your UI might still show the error from the previous failed attempt. Resetting ensures the UI accurately reflects the outcome of the latest operation.

Prevent Stale Data Display: Similar to errors, you wouldn't want to display data from a previous successful fetch if the current one is still loading or has failed. Resetting states clears old data and messages, ensuring the UI is a true representation of the latest fetch attempt.

In summary, resetting states like error at the beginning of your effect function is about ensuring the component correctly represents the state of the latest operation, not the leftover state from previous interactions, enhancing both the accuracy of your application's UI and the user experience. */

//--------NOTES on  if (!response.ok)
/* if (!response.ok) { ... } checks if the fetch response indicates an unsuccessful request. The response.ok property returns true for HTTP status codes in the 200–299 range, which are considered successful. For any status code outside this range, response.ok will be false, indicating some sort of error occurred with the request (e.g., 404 Not Found, 500 Internal Server Error).

Inside this block, you set the error state with detailed information about what went wrong using response.status and response.statusText. This helps you provide more informative feedback to the user or for debugging purposes.

setIsLoading(false); ensures that your loading state is updated to reflect that the fetch operation has completed, even though it resulted in an error.

return; exits the function early since an error occurred, preventing any further execution of the function that would process the response as if it were successful.

This approach enhances the robustness of your error handling by ensuring that errors due to unsuccessful responses are caught and handled appropriately, in addition to any network errors that might be caught by the catch block. */
