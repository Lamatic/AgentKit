"use client";

interface JobUrlInputProps {
  urls: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
}

export function JobUrlInput({ urls, onChange, disabled }: JobUrlInputProps) {
  const addUrl = () => onChange([...urls, ""]);

  const updateUrl = (index: number, value: string) => {
    const updated = [...urls];
    updated[index] = value;
    onChange(updated);
  };

  const removeUrl = (index: number) => {
    onChange(urls.filter((_, i) => i !== index));
  };

  return (
    <div className="job-url-input">
      <label>
        Job Posting URLs
        <span className="label-hint">Direct links to individual job roles</span>
      </label>
      <div className="url-list">
        {urls.map((url, index) => (
          <div key={index} className="url-row">
            <input
              type="url"
              value={url}
              onChange={(e) => updateUrl(index, e.target.value)}
              disabled={disabled}
              placeholder="https://jobs.example.com/role-title-12345"
            />
            {urls.length > 1 && (
              <button
                type="button"
                onClick={() => removeUrl(index)}
                disabled={disabled}
                className="remove-btn"
                aria-label="Remove URL"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addUrl}
        disabled={disabled || urls.length >= 10}
        className="add-btn"
      >
        + Add another job URL
      </button>
      <p className="url-hint">
        Use direct job posting pages, not search results or company career homepages.
      </p>
    </div>
  );
}
