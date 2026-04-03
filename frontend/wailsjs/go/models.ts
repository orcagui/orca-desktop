export namespace main {
	
	export class ContainerInfo {
	    id: string;
	    shortId: string;
	    name: string;
	    image: string;
	    imageId: string;
	    status: string;
	    state: string;
	    project: string;
	    service: string;
	    ports: string;
	
	    static createFrom(source: any = {}) {
	        return new ContainerInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.shortId = source["shortId"];
	        this.name = source["name"];
	        this.image = source["image"];
	        this.imageId = source["imageId"];
	        this.status = source["status"];
	        this.state = source["state"];
	        this.project = source["project"];
	        this.service = source["service"];
	        this.ports = source["ports"];
	    }
	}
	export class ImageInfo {
	    id: string;
	    shortId: string;
	    primaryTag: string;
	    repoTags: string[];
	    repoDigests: string[];
	    created: number;
	    size: number;
	    sharedSize: number;
	    containers: number;
	
	    static createFrom(source: any = {}) {
	        return new ImageInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.shortId = source["shortId"];
	        this.primaryTag = source["primaryTag"];
	        this.repoTags = source["repoTags"];
	        this.repoDigests = source["repoDigests"];
	        this.created = source["created"];
	        this.size = source["size"];
	        this.sharedSize = source["sharedSize"];
	        this.containers = source["containers"];
	    }
	}

}

