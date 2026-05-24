// import { toast } from "react-toastify";
// export default function LeadCategory() {
//   return (
//     <>
//       <h1>Lead Category</h1>
//         <button
//         className="btn btn-warning"
//         onClick={() => toast.error("Test Toast")}
//         >
//         Test Toast
//         </button>
//       <div className="card">
//         <div className="card-body">
//           Lead category list will come here.
//         </div>
//       </div>
//     </>
//   );
// }

// import { useState,useEffect } from "react";
// import { toast } from "react-toastify";

// export default function LeadCategory() {

//   const [rows, setRows] = useState([
//     { id: 1, name: "Hot Lead" },
//     { id: 2, name: "Warm Lead" },
//   ]);


//   const [show, setShow] = useState(false);
//   const [editId, setEditId] = useState(null);
//   const [name, setName] = useState("");
//   const [q, setQ] = useState("");

//   const filtered = rows.filter(r =>
//     r.name.toLowerCase().includes(q.toLowerCase())
//   );

//   const openAdd = () => {
//     setEditId(null);
//     setName("");
//     setShow(true);
//   };

//   const openEdit = (row) => {
//     setEditId(row.id);
//     setName(row.name);
//     setShow(true);
//   };

//   const save = () => {
//     if (!name.trim()) {
//       toast.error("Category name required");
//       return;
//     }

//     if (editId) {
//       setRows(rows.map(r =>
//         r.id === editId ? { ...r, name } : r
//       ));
//       toast.success("Category updated");
//     } else {
//       setRows([
//         ...rows,
//         { id: Date.now(), name }
//       ]);
//       toast.success("Category created");
//     }

//     setShow(false);
//   };

//   const remove = (id) => {
//     if (!confirm("Delete category?")) return;
//     setRows(rows.filter(r => r.id !== id));
//     toast.success("Category deleted");
//   };

//   return (
//     <>
//       {/* Header */}
//       <div className="d-flex justify-content-between mb-3">
//         <h3>Lead Category</h3>

//         <button className="btn btn-primary" onClick={openAdd}>
//           <i className="fas fa-plus me-2"></i>
//           Add Category
//         </button>
//       </div>

//       {/* Card */}
//       <div className="card">
//         <div className="card-header">
//           <input
//             className="form-control w-25"
//             placeholder="Search"
//             value={q}
//             onChange={e => setQ(e.target.value)}
//           />
//         </div>

//         <div className="card-body p-0">
//           <table className="table table-hover">
//             <thead>
//               <tr>
//                 <th>ID</th>
//                 <th>Name</th>
//                 <th width="160">Action</th>
//               </tr>
//             </thead>

//             <tbody>
//               {filtered.map(r => (
//                 <tr key={r.id}>
//                   <td>{r.id}</td>
//                   <td>{r.name}</td>
//                   <td>
//                     <button
//                       className="btn btn-sm btn-info me-2"
//                       onClick={() => openEdit(r)}
//                     >
//                       Edit
//                     </button>

//                     <button
//                       className="btn btn-sm btn-danger"
//                       onClick={() => remove(r.id)}
//                     >
//                       Delete
//                     </button>
//                   </td>
//                 </tr>
//               ))}

//               {filtered.length === 0 && (
//                 <tr>
//                   <td colSpan="3" className="text-center p-4">
//                     No records
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Modal */}
//       {show && (
//   <>
//     <div className="modal fade show" style={{display: "block"}}>
//       <div className="modal-dialog modal-dialog-centered">
//         <div className="modal-content">

//           <div className="modal-header">
//             <h5 className="modal-title">
//               {editId ? "Edit" : "Add"} Category
//             </h5>
//             <button
//               className="close"
//               onClick={() => setShow(false)}
//             >
//               ×
//             </button>
//           </div>

//           <div className="modal-body">
//             <label>Category Name</label>
//             <input
//               className="form-control"
//               value={name}
//               onChange={e => setName(e.target.value)}
//               autoFocus
//             />
//           </div>

//           <div className="modal-footer">
//             <button
//               className="btn btn-secondary"
//               onClick={() => setShow(false)}
//             >
//               Cancel
//             </button>

//             <button
//               className="btn btn-primary"
//               onClick={save}
//             >
//               Save
//             </button>
//           </div>

//         </div>
//       </div>
//     </div>

//     {/* Backdrop */}
//     <div className="modal-backdrop fade show"></div>
//   </>
// )}

//     </>
//   );
// }

import DataTable from "react-data-table-component";
import { useEffect, useState, useMemo, useReducer } from "react";
import { Modal, Button, Form, Dropdown } from "react-bootstrap";
import { useSearchParams,useNavigate } from "react-router-dom";
import api from "../api";
import Swal from "sweetalert2";
import { toast } from "react-toastify"


// ================= HELPERS =================

function getNum(v, d) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : d;
}


// ================= REDUCER =================

function tableReducer(state, action) {
  switch (action.type) {
    case "PAGE":
      return { ...state, page: action.page };

    case "PER_PAGE":
      return { ...state, perPage: action.perPage, page: 1 };

    case "SEARCH":
      return { ...state, search: action.search, page: 1 };

    case "SORT":
      return { ...state, sortField: action.field, sortDir: action.dir };

    default:
      return state;
  }
}


// ================= COMPONENT =================

export default function LeadCategory() {

  const [params, setParams] = useSearchParams();
  const nav = useNavigate();
  // -------- INIT FROM URL --------
  const initialTable = {
    page: getNum(params.get("page"), 1),
    perPage: getNum(params.get("perPage"), 25),
    search: params.get("search") || "",
    sortField: params.get("sort") || "id",
    sortDir: params.get("dir") || "desc",
  };

  const [table, dispatch] = useReducer(tableReducer, initialTable);

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [searchInput, setSearchInput] = useState(initialTable.search);

  // -------- column visibility --------
  const [visibleCols, setVisibleCols] = useState(() => {
    const saved = localStorage.getItem('category-visible-cols');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      id: true,
      name: true,
      action: true,
    };
  });

  useEffect(() => {
    localStorage.setItem('category-visible-cols', JSON.stringify(visibleCols));
  }, [visibleCols]);

  // -------- modal --------
  const [show, setShow] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);



  // ================= URL SYNC =================

  useEffect(() => {
    const newParams = new URLSearchParams({
      page: table.page,
      perPage: table.perPage,
      search: table.search,
      sort: table.sortField,
      dir: table.sortDir,
    });

    if (newParams.toString() !== params.toString()) {
      setParams(newParams);
    }
  }, [table]);



  // ================= LOAD DATA (NO DOUBLE CALL) =================

  useEffect(() => {

    const controller = new AbortController();

    const load = async () => {
      try {
        setLoading(true);

        const res = await api.get("/lead-categories", {
          params: table,
          signal: controller.signal
        });

        setRows(res.data.data);
        setTotal(res.data.total);

      } finally {
        setLoading(false);
      }
    };

    load();
    return () => controller.abort();

  }, [table, reloadKey]);


  // ================= SEARCH DEBOUNCE =================

  useEffect(() => {
    const t = setTimeout(() => {
      const s = searchInput.trim();
      if (s !== table.search) {
        dispatch({ type: "SEARCH", search: s });
      }
    }, 400);

    return () => clearTimeout(t);
  }, [searchInput]);



  // ================= MODAL =================

  const openAdd = () => {
    setEditRow(null);
    setName("");
    setErr("");
    setShow(true);
  };

  const openEdit = (row) => {
    setEditRow(row);
    setName(row.name);
    setErr("");
    setShow(true);
  };



  // ================= SAVE =================

  const save = async () => {
    if (!name.trim()) {
       toast.warning("Category name required");
      // setErr("Name required");
      return;
    }

    try {
      setSaving(true);
      if (editRow) {
        await api.put(`/lead-categories/${editRow.id}`, { name });
      } else {
        await api.post(`/lead-categories`, { name });
      }

      setShow(false);
      setReloadKey(k => k + 1);

      // Swal.fire({
      //   icon: "success",
      //   title: "Saved",
      //   timer: 1200,
      //   showConfirmButton: false
      // });
       toast.success("Category saved successfully");

    } catch (e) {
      toast.error(e.response?.data?.errors?.name?.[0] ?? "Save failed");
      // setErr(e.response?.data?.errors?.name?.[0] ?? "Save failed");
    }
    finally {
      setSaving(false);   // ✅ stop loader
    }
  };



  // ================= DELETE =================

  const remove = (row) => {
    Swal.fire({
      title: "Delete category?",
      icon: "warning",
      showCancelButton: true,
    }).then(async (r) => {
      if (!r.isConfirmed) return;
      await api.delete(`/lead-categories/${row.id}`);
      setReloadKey(k => k + 1);
    });
  };



  // ================= COLUMNS =================

  const columns = useMemo(() => {

    const all = [

      visibleCols.id && {
        name: "ID",
        selector: r => r.id,
        sortable: true,
        sortField: "id",
        width: "100px"
      },

      visibleCols.name && {
        name: "Name",
        selector: r => r.name,
        sortable: true,
        sortField: "name"
      },

      visibleCols.action && {
        name: "Action",
        width: "140px",
        cell: row => (
          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary" size="sm" id={`action-${row.id}`}>
              <i className="fas fa-ellipsis-v"></i> Actions
            </Dropdown.Toggle>

            <Dropdown.Menu>
              <Dropdown.Item onClick={() => nav(`/lead-categories/${row.id}/subcategories`)}>
                <i className="fas fa-sitemap text-primary me-2"></i> Subcategories
              </Dropdown.Item>
              <Dropdown.Item onClick={() => nav(`/lead-categories/${row.id}/activity`)}>
                <i className="fas fa-history text-info me-2"></i> Activity
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item onClick={() => openEdit(row)}>
                <i className="fas fa-edit text-primary me-2"></i> Edit
              </Dropdown.Item>
              <Dropdown.Item onClick={() => remove(row)} className="text-danger">
                <i className="fas fa-trash text-danger me-2"></i> Delete
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        )
      }

    ];

    return all.filter(Boolean);

  }, [visibleCols]);



  // ================= UI =================

  return (
    <>
      <div className="card card-outline card-primary">

        {/* HEADER */}
        <div className="card-header">
          <div className="row g-2 align-items-center">

            <div className="col-12 col-md-6">
              <h3 className="card-title">Categories</h3>
            </div>

            <div className="col-12 col-md-6">
              <div className="d-flex gap-2 flex-wrap justify-content-md-end">

                <input
                  className="form-control form-control-sm"
                  style={{ maxWidth: 220 }}
                  placeholder="Search..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                />

                <button
                  className="btn btn-primary btn-sm"
                  onClick={openAdd}
                >
                  <i className="fas fa-plus"></i> Add
                </button>

              </div>
            </div>

          </div>
        </div>


        {/* COLUMN TOGGLE */}
        <div className="p-2 border-bottom bg-light">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="text-muted small fw-bold">Show columns:</span>

            <Dropdown>
              <Dropdown.Toggle variant="outline-secondary" size="sm" id="col-toggle">
                <i className="fas fa-columns me-1"></i>
                {[
                  visibleCols.id && 'ID',
                  visibleCols.name && 'Name'
                ].filter(Boolean).join(', ') || 'None'}
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <Dropdown.Item
                  active={visibleCols.id}
                  onClick={() => setVisibleCols(v => ({ ...v, id: !v.id }))}
                >
                  <i className={`fas ${visibleCols.id ? 'fa-check-square text-primary' : 'fa-square'} me-2`}></i>
                  ID
                </Dropdown.Item>
                <Dropdown.Item
                  active={visibleCols.name}
                  onClick={() => setVisibleCols(v => ({ ...v, name: !v.name }))}
                >
                  <i className={`fas ${visibleCols.name ? 'fa-check-square text-primary' : 'fa-square'} me-2`}></i>
                  Name
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>


        {/* TABLE */}
        <div className="card-body p-0">

          <DataTable keyField="id"
          className="modern-datatable"
            columns={columns}
            data={rows}
            progressPending={loading}
          progressComponent={<div className="p-4 text-center"><div className="spinner-border spinner-border-sm me-2"></div>Loading...</div>}
            persistTableHead

            pagination
            paginationServer
            paginationTotalRows={total}
            paginationPerPage={table.perPage}

            onChangePage={(p)=>{
              if (p !== table.page) {
                dispatch({type:"PAGE",page:p})
              }
            }}

            onChangeRowsPerPage={(n)=>{
              if (n !== table.perPage) {
                dispatch({type:"PER_PAGE",perPage:n})
              }
            }}

            sortServer
            onSort={(col,dir)=>{
              if (col.sortField) {
                dispatch({type:"SORT",field:col.sortField,dir})
              }
            }}

            striped
            highlightOnHover
            dense   
          noDataComponent={
            <div className="p-5 text-center">
              <i className="fas fa-folder-open text-muted mb-3" style={{ fontSize: 48, opacity: 0.4 }}></i>
              <div className="fw-semibold text-secondary mb-1">No data found</div>
              <div className="small text-muted">Try adjusting your filters or check back later</div>
            </div>
          }
          />
        </div>
      </div>



      {/* MODAL */}

      <Modal show={show} onHide={()=>setShow(false)} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>
            {editRow ? "Edit Category" : "Add Category"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form.Label>Name</Form.Label>
          <Form.Control
            value={name}
            onChange={e=>setName(e.target.value)}
          />
          {err && <div className="text-danger mt-2">{err}</div>}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={()=>setShow(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={saving}>
            {saving && (
              <span className="spinner-border spinner-border-sm me-2"></span>
            )}
            {saving ? "Saving..." : "Save"}
          </Button>
          {/* <Button variant="primary" onClick={save}>
            Save
          </Button> */}
        </Modal.Footer>
      </Modal>

    </>
  );
}
