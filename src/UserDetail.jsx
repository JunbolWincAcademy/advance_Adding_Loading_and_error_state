import { useEffect, useState } from "react";

const flakyFetch = async url => {
  // Sleep for a bit to simulate loading.
  await new Promise(r => setTimeout(r, 1000));

  // 1/6 requests throw a JavaScript error
  const randomValue = Math.random() * 100;
  if (randomValue <= 16) {
    throw new Error("The server did not respond");
  }

  // 1/6 responses return an invalid response
  let response = await fetch(url);
  if (randomValue <= 32) {
    const data = { error: "Server error" };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const init = { status: 500, statusText: "Server Error" };
    response = new Response(blob, init);
  }
  return response;
};

export const UserDetail = ({ user }) => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    let ignore = false;
    setPosts([]);

    const fetchUserPosts = async () => {
      const response = await flakyFetch(
        `http://localhost:3000/users/${user.id}/posts`
      );

      const posts = await response.json();
      setPosts(posts);
      setIsLoading(false);
    };
    fetchUserPosts();

    return () => {
      ignore = true;
    };
  }, [user]);

  return (
    <div className="user-details">
      <p>{user.name}</p>
      <p>{user.email}</p>
      <ul>
        {posts &&
          posts.map(post => (
            <li key={post.id}>
              <b>{post.title}</b>
              <p>{post.body}</p>
            </li>
          ))}
      </ul>
    </div>
  );
};
