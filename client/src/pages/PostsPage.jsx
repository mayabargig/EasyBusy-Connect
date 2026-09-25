import { useCallback, useEffect, useState } from "react";
import { postCategories, postCategoryLabel } from "../constants/postCategories";
import { useAuth } from "../hooks/useAuth";
import { api, getApiErrorMessage } from "../services/api";

const emptyPost = {
  content: "",
  category: "general",
  mediaType: "none",
  mediaUrl: "",
};

const emptyFilters = {
  q: "",
  category: "",
  dateFrom: "",
  dateTo: "",
};

function authorDisplayName(author) {
  return author?.businessName || `${author?.firstName || "Unknown"} ${author?.lastName || "user"}`;
}

function formatPostDate(value) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function PostMedia({ post }) {
  if (!post.mediaUrl || post.mediaType === "none") return null;

  if (post.mediaType === "video") {
    return (
      <video className="post-media" controls preload="metadata">
        <source src={post.mediaUrl} />
        Your browser does not support video playback.
      </video>
    );
  }

  return <img alt="Post attachment" className="post-media" loading="lazy" src={post.mediaUrl} />;
}

function PostFields({ form, onChange }) {
  return (
    <>
      <label>
        What would you like to share?
        <textarea
          maxLength="1200"
          name="content"
          onChange={onChange}
          placeholder="Share an update, recommendation or question…"
          required
          rows="5"
          value={form.content}
        />
        <small>{form.content.length}/1,200 characters</small>
      </label>

      <div className="form-grid">
        <label>
          Category
          <select name="category" onChange={onChange} value={form.category}>
            {postCategories.map((category) => (
              <option key={category.value} value={category.value}>{category.label}</option>
            ))}
          </select>
        </label>
        <label>
          Media type
          <select name="mediaType" onChange={onChange} value={form.mediaType}>
            <option value="none">Text only</option>
            <option value="image">Image URL</option>
            <option value="video">Video URL</option>
          </select>
        </label>
      </div>

      {form.mediaType !== "none" && (
        <label>
          {form.mediaType === "video" ? "Video URL" : "Image URL"}
          <input
            name="mediaUrl"
            onChange={onChange}
            placeholder="https://example.com/media"
            required
            type="url"
            value={form.mediaUrl}
          />
          <small>Use a direct public URL that begins with http:// or https://.</small>
        </label>
      )}
    </>
  );
}

export function PostsPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState(emptyPost);
  const [filters, setFilters] = useState(emptyFilters);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyPost);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadPosts = useCallback(async (searchFilters = emptyFilters) => {
    setError("");
    setIsLoading(true);

    try {
      const response = await api.get("/posts", {
        params: {
          q: searchFilters.q || undefined,
          category: searchFilters.category || undefined,
          dateFrom: searchFilters.dateFrom || undefined,
          dateTo: searchFilters.dateTo || undefined,
          limit: 30,
        },
      });
      setPosts(response.data.posts);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  function updateForm(setter) {
    return (event) => {
      const { name, value } = event.target;
      setter((current) => ({
        ...current,
        [name]: value,
        ...(name === "mediaType" && value === "none" ? { mediaUrl: "" } : {}),
      }));
    };
  }

  async function publishPost(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const response = await api.post("/posts", newPost);
      setPosts((current) => [response.data.post, ...current]);
      setNewPost(emptyPost);
      setSuccess("Your post was published.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  function beginEdit(post) {
    setEditingId(post.id);
    setEditForm({
      content: post.content,
      category: post.category,
      mediaType: post.mediaType,
      mediaUrl: post.mediaUrl,
    });
    setError("");
    setSuccess("");
  }

  async function saveEdit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const response = await api.patch(`/posts/${editingId}`, editForm);
      setPosts((current) => current.map((post) => (
        post.id === editingId ? response.data.post : post
      )));
      setEditingId(null);
      setSuccess("Post updated successfully.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function removePost(postId) {
    const confirmed = window.confirm("Delete this post permanently?");
    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await api.delete(`/posts/${postId}`);
      setPosts((current) => current.filter((post) => post.id !== postId));
      setSuccess("Post deleted successfully.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  }

  function handleFilterChange(event) {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function searchPosts(event) {
    event.preventDefault();
    loadPosts(filters);
  }

  function clearFilters() {
    setFilters(emptyFilters);
    loadPosts(emptyFilters);
  }

  return (
    <section className="posts-page section-container">
      <div className="page-heading posts-heading">
        <div>
          <span className="eyebrow">Community feed</span>
          <h1>Share local knowledge and updates.</h1>
          <p>Publish an update and discover posts from customers and businesses.</p>
        </div>
      </div>

      {error && <div className="form-alert page-alert" role="alert">{error}</div>}
      {success && <div className="form-success page-alert" role="status">{success}</div>}

      <div className="posts-layout">
        <aside>
          <form className="post-composer" onSubmit={publishPost}>
            <div>
              <span className="eyebrow">Create</span>
              <h2>New post</h2>
            </div>
            <PostFields form={newPost} onChange={updateForm(setNewPost)} />
            <button className="button primary" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Publishing…" : "Publish post"}
            </button>
          </form>
        </aside>

        <div className="feed-column">
          <form className="post-search-panel" onSubmit={searchPosts}>
            <label>
              Keyword
              <input name="q" onChange={handleFilterChange} placeholder="Search post text" value={filters.q} />
            </label>
            <label>
              Category
              <select name="category" onChange={handleFilterChange} value={filters.category}>
                <option value="">All categories</option>
                {postCategories.map((category) => (
                  <option key={category.value} value={category.value}>{category.label}</option>
                ))}
              </select>
            </label>
            <label>
              From
              <input name="dateFrom" onChange={handleFilterChange} type="date" value={filters.dateFrom} />
            </label>
            <label>
              To
              <input name="dateTo" onChange={handleFilterChange} type="date" value={filters.dateTo} />
            </label>
            <div className="post-search-actions">
              <button className="button primary" disabled={isLoading} type="submit">Search</button>
              <button className="button secondary" onClick={clearFilters} type="button">Clear</button>
            </div>
          </form>

          {isLoading && <div className="page-status compact-status"><p>Loading posts…</p></div>}
          {!isLoading && posts.length === 0 && (
            <div className="empty-state post-empty-state">
              <h2>No posts found.</h2>
              <p>Publish the first post or change the search filters.</p>
            </div>
          )}

          <div className="post-list">
            {posts.map((post) => (
              <article className="post-card" key={post.id}>
                <header className="post-card-header">
                  <span className="post-author-avatar">
                    {post.author?.avatarUrl
                      ? <img alt="" src={post.author.avatarUrl} />
                      : `${post.author?.firstName?.[0] || "?"}${post.author?.lastName?.[0] || ""}`}
                  </span>
                  <div>
                    <h2>{authorDisplayName(post.author)}</h2>
                    <p>{formatPostDate(post.createdAt)}</p>
                  </div>
                  <span className="category-badge">{postCategoryLabel(post.category)}</span>
                </header>

                {editingId === post.id ? (
                  <form className="post-edit-form" onSubmit={saveEdit}>
                    <PostFields form={editForm} onChange={updateForm(setEditForm)} />
                    <div className="post-owner-actions">
                      <button className="button primary" disabled={isSubmitting} type="submit">Save changes</button>
                      <button className="button secondary" onClick={() => setEditingId(null)} type="button">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <p className="post-content">{post.content}</p>
                    <PostMedia post={post} />
                    {post.author?.id === user.id && (
                      <footer className="post-owner-actions">
                        <button className="text-action-button" onClick={() => beginEdit(post)} type="button">Edit</button>
                        <button className="text-danger-button" onClick={() => removePost(post.id)} type="button">Delete</button>
                      </footer>
                    )}
                  </>
                )}
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
