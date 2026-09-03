import { Link } from 'react-router-dom';

function RequestCard({ request, onDeleteRequest, onAcknowledge }) {
  function handleDelete(e) {
    e.stopPropagation();
    if (onDeleteRequest) onDeleteRequest(request.id);
  }

  return (
    <article className="request-card">
      <div>
        <p className="request-id">{request.id}</p>
        <h3><Link to={`/requests/${request.id}`}>{request.requestType}</Link></h3>
        <p>{request.location}</p>
        <p>{request.details}</p>
        <p><span className={`badge ${request.status}`}>{request.status}</span> · {request.priority}</p>
      </div>
      <div className="request-card-actions">
        {request.status === 'pending' && (
          <button
            type="button"
            className="button secondary"
            onClick={(e) => {
              e.stopPropagation();
              if (onAcknowledge) onAcknowledge(request.id);
            }}
          >
            รับเรื่อง
          </button>
        )}

        <button className="button danger" type="button" onClick={handleDelete}>
          ลบ
        </button>
      </div>
    </article>
  );
}

export default RequestCard;