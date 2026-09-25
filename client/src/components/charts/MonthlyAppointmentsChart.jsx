import { useEffect, useRef } from "react";
import * as d3 from "d3";

function monthLabel(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function MonthlyAppointmentsChart({ data }) {
  const svgRef = useRef(null);
  const hasData = data.some((item) => item.count > 0);

  useEffect(() => {
    if (!svgRef.current || !hasData) return;

    const width = 760;
    const height = 380;
    const margin = { top: 32, right: 24, bottom: 58, left: 52 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const chart = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);
    const x = d3
      .scaleBand()
      .domain(data.map((item) => item.month))
      .range([0, innerWidth])
      .padding(0.28);
    const maxCount = d3.max(data, (item) => item.count) || 1;
    const y = d3
      .scaleLinear()
      .domain([0, maxCount])
      .nice()
      .range([innerHeight, 0]);

    chart
      .append("g")
      .attr("class", "chart-grid")
      .call(
        d3
          .axisLeft(y)
          .ticks(Math.min(maxCount, 5))
          .tickSize(-innerWidth)
          .tickFormat(""),
      );

    chart
      .append("g")
      .attr("class", "chart-axis")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(x).tickFormat(monthLabel));
    chart
      .append("g")
      .attr("class", "chart-axis")
      .call(
        d3
          .axisLeft(y)
          .ticks(Math.min(maxCount, 5))
          .tickFormat(d3.format("d")),
      );

    const bars = chart
      .selectAll("rect.month-bar")
      .data(data)
      .join("rect")
      .attr("class", "month-bar")
      .attr("x", (item) => x(item.month))
      .attr("width", x.bandwidth())
      .attr("y", innerHeight)
      .attr("height", 0)
      .attr("rx", 7);

    bars
      .append("title")
      .text((item) => `${monthLabel(item.month)}: ${item.count} appointments`);
    bars
      .transition()
      .duration(650)
      .delay((_, index) => index * 55)
      .attr("y", (item) => y(item.count))
      .attr("height", (item) => innerHeight - y(item.count));

    chart
      .selectAll("text.bar-value")
      .data(data)
      .join("text")
      .attr("class", "bar-value")
      .attr("x", (item) => x(item.month) + x.bandwidth() / 2)
      .attr("y", (item) => y(item.count) - 9)
      .attr("text-anchor", "middle")
      .text((item) => item.count);
  }, [data, hasData]);

  if (!hasData) {
    return (
      <div className="chart-empty-state">
        <h3>No activity in this period</h3>
        <p>The monthly chart will update automatically when appointments are added.</p>
      </div>
    );
  }

  return (
    <svg
      aria-label="Bar chart showing appointments by month"
      className="d3-chart-svg monthly-chart"
      ref={svgRef}
      role="img"
    />
  );
}
