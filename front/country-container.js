

const CountryContainer = ()=>{
    //const host = useState('');

    const parameterStyle = {
        padding: '20 20',
        backgroundColor: '#efefef'
    }
    const parameterAutoRenewalStyle = {
        padding:'20px 50px 10px 50px',
        backgroundColor: '#efefef'
    }
    return (
        <React.Fragment>
        <div id="mapContainer">
            <div id="chartdiv"></div>
        </div>
        <div>
            <h1>Domain propagation watcher</h1>
        </div>
        <div id={'parameters'} className={parameterStyle}>
        <div>
            <label htmlFor="host">Domain for lookup</label>
            <input name="host" id="host" defaultValue="www.hyundai.com" />
            
            <label htmlFor="target">watching IP</label>
            <input name="target" id="target" defaultValue="34.111.55.4" />
            
            <button id="sendGetResult">Get DNS propagation Result</button>
        </div>
        <div className={parameterAutoRenewalStyle}>
            <input type="radio" name="intervalCheck" id="interval10" value="10000"/> 
            <label htmlFor="interval10">10초마다 업데이트</label>
            <input type="radio" name="intervalCheck" id="interval5" value="5000" /> 
            <label htmlFor="interval5">5초마다 업데이트</label>
            <input type="radio" name="intervalCheck" id="interval1"  value="1000"/> 
            <label htmlFor="interval1">1초마다 업데이트</label>
            <input type="radio" name="intervalCheck" id="interval_no"  value="0"/> 
            <label htmlFor="interval_no">업데이트 중지</label>
            </div>
        </div>
        </React.Fragment>
    )
}


ReactDOM.render(<CountryContainer />, document.querySelector('#react-country-container'));