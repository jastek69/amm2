// Chart from https://apexcharts.com/docs/react-charts/
// Line Chart

export const options = {
    chart: {
      height: 350,
      type: 'line', // Type of chart
      zoom: {
        enabled: false // cannot zoom
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'straight'
    },
    title: {
      text: 'Reserve History', // reserves inside of amm
      align: 'left'
    },
    grid: {
      row: {
        colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
        opacity: 0.5
      },
    }
  }
  
  // Code in the series as a temporary placeholder for demonstration
  export const series = [{
    data: [10, 41, 35, 51, 49, 62, 69, 91, 148]
  }]
  