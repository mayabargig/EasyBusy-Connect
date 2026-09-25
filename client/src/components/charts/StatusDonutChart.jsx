import { useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";

const statusMeta = {
  pending: { label: "Pending", color: "#f4b860" },
  confirmed: { label: "Confirmed", color: "#2d936c" },
  declined: { label: "Declined", color: "#c96d6d" },
  cancelled: { label: "Cancelled", color: "#9b2c2c" },
  completed: { label: "Completed", color: "#5f86a3" },
};

export function StatusDonutChart({ data }) {
  const svgRef = useRef(null);
  const total = useMemo(
    () => data.reduce((sum, item) => sum + item.count, 0),
    [data],
  );

  useEffect(() => {
    if (!svgRef.current || total === 0) return;

    const width = 520;
    const height = 330;
    const radius = 125;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const chart = svg
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);
    const pie = d3
      .pie()
      .sort(null)
      .value((item) => item.count);
    const arc = d3
      .arc()
      .innerRadius(radius * 0.58)
      .outerRadius(radius)
      .cornerRadius(5)
      .padAngle(0.018);

    const slices = chart
      .selectAll("path")
      .data(pie(data.filter((item) => item.count > 0)))
      .join("path")
      .attr("fill", (item) => statusMeta[item.data.status].color)
      .attr("stroke", "#fffdf8")
      .attr("stroke-width", 3);

    slices
      .append("title")
      .text((item) => `${statusMeta[item.data.status].label}: ${item.data.count}`);

    slices
      .transition()
      .duration(650)
      .attrTween("d", (item) => {
        const interpolate = d3.interpolate(
          { startAngle: item.startAngle, endAngle: item.startAngle },
          item,
        );
        return (time) => arc(interpolate(time));
      });

    chart
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-0.08em")
      .attr("class", "donut-total")
      .text(total);
    chart
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1.35em")
      .attr("class", "donut-caption")
      .text("appointments");
  }, [data, total]);

  if (total === 0) {
    return (
      <div className="chart-empty-state">
        <h3>No appointment data yet</h3>
        <p>The status chart will appear after the first appointment is created.</p>
      </div>
    );
  }

  return (
    <div className="donut-chart-layout">
      <svg
        aria-label="Donut chart showing appointments by status"
        className="d3-chart-svg"
        ref={svgRef}
        role="img"
      />
      <ul className="chart-legend">
        {data.map((item) => (
          <li key={item.status}>
            <span
              className="legend-color"
              style={{ backgroundColor: statusMeta[item.status].color }}
            />
            <span>{statusMeta[item.status].label}</span>
            <strong>{item.count}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
