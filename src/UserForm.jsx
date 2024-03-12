import { useState } from "react";

export const UserForm = ({ createUser }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");

  const handleSubmit = event => {
    event.preventDefault();

    // An async function, but no need to wait for it.
    createUser({ name, email, website });

    // Empty the form fields.
    setName("");
    setEmail("");
    setWebsite("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        required="required"
        placeholder="name"
        onChange={e => setName(e.target.value)}
        value={name}
      />
      <input
        type="email"
        required="required"
        placeholder="email"
        onChange={e => setEmail(e.target.value)}
        value={email}
      />
      <input
        type="url"
        required="required"
        placeholder="website"
        onChange={e => setWebsite(e.target.value)}
        value={website}
      />
      <button type="submit">Add user</button>
    </form>
  );
};
