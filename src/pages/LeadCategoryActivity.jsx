import { useParams, useNavigate } from "react-router-dom";

export default function LeadCategoryActivity() {

  const { id } = useParams();
  const nav = useNavigate();

  // ✅ Dummy data
  const logs = [
    {
      action: "create",
      text: "Category created",
      user: "Admin",
      time: "2026-02-05 10:22"
    },
    {
      action: "update",
      text: "Name changed: Cold → Warm",
      user: "Admin",
      time: "2026-02-05 11:10"
    },
    {
      action: "update",
      text: "Status updated",
      user: "Manager",
      time: "2026-02-06 09:05"
    },
    {
      action: "delete",
      text: "Category removed",
      user: "Admin",
      time: "2026-02-06 12:30"
    }
  ];

  const icon = (a) => {
    if (a === "create") return "fas fa-plus bg-success";
    if (a === "update") return "fas fa-edit bg-info";
    if (a === "delete") return "fas fa-trash bg-danger";
    return "fas fa-circle bg-secondary";
  };

  return (
    <div className="card card-outline card-primary">

      <div className="card-header d-flex justify-content-between">
        <h3 className="card-title">
          Category Activity — ID #{id}
        </h3>

        <button
          className="btn btn-sm btn-secondary"
          onClick={() => nav(-1)}
        >
          ← Back
        </button>
      </div>

      <div className="card-body">

        <div className="timeline">

          {logs.map((l, i) => (

            <div key={i}>

              <i className={icon(l.action)}></i>

              <div className="timeline-item">

                <span className="time">
                  <i className="far fa-clock"></i>
                  {" "} {l.time}
                </span>

                <h3 className="timeline-header">
                  {l.action.toUpperCase()}
                </h3>

                <div className="timeline-body">
                  {l.text}
                </div>

                <div className="timeline-footer text-muted">
                  by {l.user}
                </div>

              </div>
            </div>

          ))}

        </div>

      </div>
    </div>
  );
}
