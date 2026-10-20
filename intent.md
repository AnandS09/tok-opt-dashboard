# Goal:  Infravana webpage UI - playground

Create a UI in the Infravana webpage where users can get a sense of where to put their money on inference. 
  
They have a few knobs to play with like: 
- Number of users or workflows  
- Cash budget 
- Tier of resources - GPU categories, Accelerator categories etc  
  
The user interacts in natural language with prompts (this can change based on budget and design's evolution).  
What graph to be shown depends on what the user asks.  However, they are centered around token throughput p95, cost in dollar terms, performance quality over benchmarks. 
  
Example prompt,  

a. "I lead a company of 50 people and need to allocate a budget of $100K per quarter. My team runs a mix of software and hardware design workflows. Show me a good allocation strategy"  
  
What we want to show:  
- Allocation budget for various existing providers  
- Similar allocation budget but with infravana stack managing  
- The aim is to show infravana is providing more bang for the buck by making deploying across heterogenous infra (mix of various classes of GPUs and accelerators like d-Matrix, Rebellions etc) at much lower cost 
- Show the charts for various case studies with different classes of models. Ie assuming the workloads are frontier model heavy, or a mix of frontier and mid tier, open weight vs proprietary etc  
  
b. "My company is now scaling from 50 to 100 people. Our workloads are Opus and Fable heavy. However, to keep our token budget tractable, we are deliberating on a strategy of using a mixture of open weight and proprietary models. We are planning to increase our spend from 100K a quarter to 200K a quarter. Please help me plan the allocation"  
  
- We show similar charts and depict the positive difference Infravana stack can bring.  
  
## Scope of this work 
- Design the UI and figure out the mechanics  
- Assume the backend can provide all the data as CSV files  
- Decide the types of charts needed. The set of charts to show is predetermined -- the runtime is chosing which among the predetermined charts to show, not inventing and populating a new type of chart on the fly.   
- Filter our un-related, malicious or profane queries
- Work within budget - one query per user 
- The user is presented with a dash board with knobs, they can play around with the knobs to try our variations. This does not involve any more llm queries.  

## Whats not it scope
* Designing the backend  
* Designing anything other than the UI 
* 